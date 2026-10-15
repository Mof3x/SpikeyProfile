import { zipSync, strToU8 } from "fflate";

import {
  csvToDaily,
  guessMapping,
  parseCsv,
  parseDateCell,
} from "@/core/sources/importers/csv";
import {
  parseSamsungFiles,
  parseSamsungZip,
} from "@/core/sources/importers/samsungHealth";
import {
  addSleep,
  DailyAccumulator,
  mergeDailyValues,
} from "@/core/sources/health/aggregate";

describe("CSV import", () => {
  const text = [
    "Date;Steps;Resting HR;Notes",
    '01/02/2026;8200;61;"walked, then rested"',
    "02/02/2026;4100;64;",
    "02/02/2026;900;;",
    "13/02/2026;10000;59;ok",
  ].join("\r\n");
  const table = parseCsv(text);

  test("parses semicolons, quotes with commas and CRLF", () => {
    expect(table.headers).toEqual(["Date", "Steps", "Resting HR", "Notes"]);
    expect(table.rows[0][3]).toBe("walked, then rested");
    expect(table.rows).toHaveLength(4);
  });

  test("guesses the date column, day-first order and numeric columns", () => {
    const mapping = guessMapping(table);
    expect(mapping.dateColumn).toBe(0);
    expect(mapping.dayFirst).toBe(true);
    expect(mapping.columns.map((c) => c.label)).toEqual([
      "Steps",
      "Resting HR",
    ]);
    expect(mapping.columns.find((c) => c.label === "Steps")!.combine).toBe(
      "sum",
    );
    expect(mapping.columns.find((c) => c.label === "Resting HR")!.combine).toBe(
      "mean",
    );
  });

  test("adds up or averages per day", () => {
    const { days, metrics, rowsUsed } = csvToDaily(table, guessMapping(table));
    expect(rowsUsed).toBe(4);
    expect(days["2026-02-02"].steps).toBe(5000);
    expect(days["2026-02-02"].resting_hr).toBe(64);
    expect(days["2026-02-13"].steps).toBe(10000);
    expect(metrics.map((m) => m.group)).toEqual(["imported", "imported"]);
  });

  test("reads ISO dates and epoch timestamps", () => {
    expect(parseDateCell("2026-03-04")!.getDate()).toBe(4);
    expect(parseDateCell("2026-03-04 22:15")!.getHours()).toBe(22);
    expect(parseDateCell("1772582400")).not.toBeNull();
    expect(parseDateCell("hello")).toBeNull();
    expect(parseDateCell("03/04/2026", false)!.getMonth()).toBe(2);
  });
});

describe("Samsung Health export", () => {
  const files: Record<string, string> = {
    "com.samsung.shealth.tracker.pedometer_day_summary.20260301120000.csv": [
      "com.samsung.shealth.tracker.pedometer_day_summary,6305012,4",
      "create_time,step_count,day_time,distance",
      `2026-02-28 23:59:00.000,7345,${Date.UTC(2026, 1, 28)},5000`,
      `2026-03-01 23:59:00.000,1200,${Date.UTC(2026, 2, 1)},800`,
    ].join("\n"),
    "com.samsung.shealth.sleep.20260301120000.csv": [
      "com.samsung.shealth.sleep,6305012,4",
      "com.samsung.health.sleep.start_time,com.samsung.health.sleep.end_time,com.samsung.health.sleep.time_offset",
      "2026-02-28 22:30:00.000,2026-03-01 06:00:00.000,UTC+0100",
    ].join("\n"),
    "com.samsung.shealth.tracker.heart_rate.20260301120000.csv": [
      "com.samsung.shealth.tracker.heart_rate,6305012,4",
      "com.samsung.health.heart_rate.start_time,com.samsung.health.heart_rate.heart_rate,com.samsung.health.heart_rate.time_offset",
      "2026-03-01 08:00:00.000,70,UTC+0000",
      "2026-03-01 12:00:00.000,80,UTC+0000",
    ].join("\n"),
    "com.samsung.shealth.stress.20260301120000.csv": [
      "com.samsung.shealth.stress,6305012,4",
      "start_time,score,time_offset",
      "2026-03-01 10:00:00.000,40,UTC+0000",
    ].join("\n"),
    "com.samsung.shealth.exercise.20260301120000.csv": [
      "com.samsung.shealth.exercise,6305012,4",
      "com.samsung.health.exercise.start_time,com.samsung.health.exercise.duration,com.samsung.health.exercise.time_offset",
      "2026-03-01 17:00:00.000,1800000,UTC+0000",
    ].join("\n"),
  };

  test("reads steps, sleep, heart rate, stress and exercise", () => {
    const result = parseSamsungFiles(files);
    expect(result.found).toEqual(
      expect.arrayContaining([
        "Steps",
        "Sleep",
        "Heart rate",
        "Stress",
        "Exercise",
      ]),
    );
    expect(result.days["2026-02-28"].steps).toBe(7345);
    expect(result.days["2026-03-01"].steps).toBe(1200);
    // 22:30 to 06:00 local time, filed under the morning you woke up.
    expect(result.days["2026-03-01"].sleepHours).toBe(7.5);
    expect(result.days["2026-03-01"].avgHr).toBe(75);
    expect(result.days["2026-03-01"].stress).toBe(40);
    expect(result.days["2026-03-01"].workoutMinutes).toBe(30);
    expect(result.metrics.map((m) => m.key)).toEqual(
      expect.arrayContaining(["steps", "sleepHours", "avgHr", "stress"]),
    );
  });

  test("unzips an export", () => {
    const zip = zipSync(
      Object.fromEntries(
        Object.entries(files).map(([k, v]) => [`export/${k}`, strToU8(v)]),
      ),
    );
    const result = parseSamsungZip(zip);
    expect(result.days["2026-02-28"].steps).toBe(7345);
  });
});

describe("health aggregation", () => {
  test("uses sleep stages for deep and REM share", () => {
    const acc = new DailyAccumulator();
    const t = (h: number, m = 0) => new Date(2026, 2, h < 12 ? 2 : 1, h, m);
    addSleep(acc, [
      { start: t(23), end: t(1), stage: "light" },
      { start: t(1), end: t(2), stage: "deep" },
      { start: t(2), end: t(2, 30), stage: "awake" },
      { start: t(2, 30), end: t(4), stage: "rem" },
    ]);
    const day = acc.result()["2026-03-02"];
    expect(day.sleepHours).toBe(4.5);
    expect(day.timeInBed).toBe(5);
    expect(Math.round(day.deepShare)).toBe(22);
    expect(Math.round(day.remShare)).toBe(33);
    expect(day.bedtime).toBe(-1);
  });

  test("merging keeps the first source's values", () => {
    const merged = mergeDailyValues(
      { "2026-03-01": { steps: 100 } },
      { "2026-03-01": { steps: 999, hrv: 50 } },
    );
    expect(merged["2026-03-01"]).toEqual({ steps: 100, hrv: 50 });
  });
});
