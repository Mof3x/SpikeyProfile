import { strFromU8, unzipSync } from "fflate";

import type { DayKey } from "@/core/analytics/dates";
import type { ExternalMetric } from "@/core/analytics/types";
import { HEALTH_METRICS } from "../healthMetrics";
import {
  addSleep,
  DailyAccumulator,
  type DailyValues,
  type SleepSegment,
} from "../health/aggregate";
import { parseCsv } from "./csv";

/**
 * Samsung Health → Settings → Download personal data produces a zip of CSV files named like
 * "com.samsung.shealth.tracker.pedometer_day_summary.20240301123456.csv". Each file starts with a
 * one-line descriptor, then a header row whose columns are often prefixed with the data type.
 * Times are stored in UTC with a separate "time_offset" column such as "UTC+0100".
 */

export interface SamsungImportResult {
  metrics: ExternalMetric[];
  days: DailyValues;
  /** Which kinds of data were found, for the confirmation screen. */
  found: string[];
}

interface SamsungTable {
  headers: string[];
  rows: string[][];
  col: (...names: string[]) => number;
}

function readTable(text: string): SamsungTable | null {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.length < 2) return null;
  // Exports start with a descriptor line like "com.samsung.shealth.sleep,6305012,4" before the header.
  const [first, second] = lines[0].split(",");
  const isDescriptor =
    /^com\.samsung\./i.test(first ?? "") && /^\d+$/.test((second ?? "").trim());
  const body = isDescriptor ? lines.slice(1).join("\n") : lines.join("\n");
  const table = parseCsv(body);
  const lower = table.headers.map((h) => h.toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = lower.findIndex((h) => h === n || h.endsWith(`.${n}`));
      if (i >= 0) return i;
    }
    return -1;
  };
  return { headers: table.headers, rows: table.rows, col };
}

function parseOffset(offset: string | undefined): number {
  const m = offset?.match(/UTC([+-])(\d{2})(\d{2})/);
  if (!m) return 0;
  const minutes = +m[2] * 60 + +m[3];
  return (m[1] === "-" ? -minutes : minutes) * 60000;
}

/** Wall-clock time where the reading was taken, expressed as a Date whose UTC fields hold that wall time. */
function wallTime(
  value: string | undefined,
  offset: string | undefined,
): Date | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{12,13}$/.test(v)) return new Date(Number(v) + parseOffset(offset));
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return new Date(
    Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0) +
      parseOffset(offset),
  );
}

const dayOf = (wall: Date): DayKey =>
  `${wall.getUTCFullYear()}-${String(wall.getUTCMonth() + 1).padStart(2, "0")}-${String(wall.getUTCDate()).padStart(2, "0")}`;

/** Convert a wall-clock (UTC-fields) date to a local Date with the same clock reading. */
const asLocal = (wall: Date) =>
  new Date(
    wall.getUTCFullYear(),
    wall.getUTCMonth(),
    wall.getUTCDate(),
    wall.getUTCHours(),
    wall.getUTCMinutes(),
  );

const num = (v: string | undefined) => {
  const n = v === undefined ? NaN : parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

const SAMSUNG_STAGES: Record<string, SleepSegment["stage"]> = {
  "40001": "awake",
  "40002": "light",
  "40003": "deep",
  "40004": "rem",
};

export const SAMSUNG_STRESS_METRIC: ExternalMetric = {
  key: "stress",
  label: "Stress score (Samsung)",
  group: "body",
  kind: "number",
  more: "a higher stress score",
  less: "a lower stress score",
  testNextDay: true,
};

export function parseSamsungFiles(
  files: Record<string, string>,
): SamsungImportResult {
  const acc = new DailyAccumulator();
  const found = new Set<string>();
  const sessions: SleepSegment[] = [];
  const stages: SleepSegment[] = [];

  for (const [path, text] of Object.entries(files)) {
    const name = path.split("/").pop()!.toLowerCase();
    if (!name.endsWith(".csv")) continue;
    const t = readTable(text);
    if (!t) continue;
    const at = (row: string[], ...names: string[]) => {
      const i = t.col(...names);
      return i >= 0 ? row[i] : undefined;
    };
    const timeOf = (row: string[]) =>
      wallTime(
        at(row, "start_time", "day_time", "create_time"),
        at(row, "time_offset"),
      );

    if (
      name.includes("pedometer_day_summary") ||
      name.includes("step_daily_trend")
    ) {
      for (const row of t.rows) {
        const w = wallTime(at(row, "day_time", "start_time"), undefined);
        const steps = num(at(row, "step_count", "count"));
        if (w && steps !== undefined) acc.add(dayOf(w), "steps", steps, "max");
      }
      found.add("Steps");
    } else if (name.includes("sleep_stage")) {
      for (const row of t.rows) {
        const s = wallTime(at(row, "start_time"), at(row, "time_offset"));
        const e = wallTime(at(row, "end_time"), at(row, "time_offset"));
        const stage = SAMSUNG_STAGES[(at(row, "stage") ?? "").trim()];
        if (s && e && stage)
          stages.push({ start: asLocal(s), end: asLocal(e), stage });
      }
      found.add("Sleep stages");
    } else if (/(shealth|health)\.sleep\.\d/.test(name)) {
      for (const row of t.rows) {
        const s = wallTime(at(row, "start_time"), at(row, "time_offset"));
        const e = wallTime(at(row, "end_time"), at(row, "time_offset"));
        if (s && e && e > s)
          sessions.push({
            start: asLocal(s),
            end: asLocal(e),
            stage: "asleep",
          });
      }
      found.add("Sleep");
    } else if (name.includes("tracker.heart_rate")) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const hr = num(at(row, "heart_rate"));
        if (w && hr) acc.add(dayOf(w), "avgHr", hr, "mean");
      }
      found.add("Heart rate");
    } else if (name.includes("health.weight")) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const kg = num(at(row, "weight"));
        if (w && kg) acc.add(dayOf(w), "weight", kg, "mean");
      }
      found.add("Weight");
    } else if (/shealth\.exercise\.\d/.test(name)) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const ms = num(at(row, "duration"));
        if (!w || ms === undefined) continue;
        const minutes = ms / 60000;
        acc.add(dayOf(w), "workouts", 1, "sum");
        acc.add(dayOf(w), "workoutMinutes", minutes, "sum");
        acc.add(dayOf(w), "exerciseMinutes", minutes, "sum");
      }
      found.add("Exercise");
    } else if (name.includes("shealth.stress")) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const score = num(at(row, "score"));
        if (w && score !== undefined)
          acc.add(dayOf(w), "stress", score, "mean");
      }
      found.add("Stress");
    } else if (name.includes("oxygen_saturation")) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const spo2 = num(at(row, "spo2"));
        if (w && spo2) acc.add(dayOf(w), "spo2", spo2, "mean");
      }
      found.add("Blood oxygen");
    } else if (name.includes("water_intake")) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const ml = num(at(row, "amount"));
        if (w && ml) acc.add(dayOf(w), "water", ml, "sum");
      }
      found.add("Water");
    } else if (name.includes("caffeine_intake")) {
      for (const row of t.rows) {
        const w = timeOf(row);
        const mg = num(at(row, "amount"));
        if (w && mg) acc.add(dayOf(w), "caffeineMg", mg, "sum");
      }
      found.add("Caffeine");
    } else if (name.includes("menstrua") || name.includes("cycle.")) {
      for (const row of t.rows) {
        const s = wallTime(at(row, "start_time"), at(row, "time_offset"));
        const e = wallTime(at(row, "end_time"), at(row, "time_offset")) ?? s;
        if (!s || !e) continue;
        const day = new Date(s);
        let guard = 0;
        while (day <= e && guard < 15) {
          acc.add(dayOf(day), "menstruationFlow", 2, "max");
          day.setUTCDate(day.getUTCDate() + 1);
          guard++;
        }
      }
      found.add("Periods");
    }
  }

  // Use detailed stages where a night has them, otherwise the whole session counts as asleep.
  const nights: SleepSegment[] = [];
  for (const session of sessions) {
    const inside = stages.filter(
      (s) => s.start < session.end && s.end > session.start,
    );
    nights.push(...(inside.length ? inside : [session]));
  }
  if (sessions.length === 0) nights.push(...stages);
  if (nights.length) addSleep(acc, nights);

  const days = acc.result();
  const keys = new Set<string>();
  Object.values(days).forEach((v) =>
    Object.keys(v).forEach((k) => keys.add(k)),
  );
  const metrics = [...HEALTH_METRICS, SAMSUNG_STRESS_METRIC].filter((m) =>
    keys.has(m.key),
  );
  return { metrics, days, found: [...found] };
}

export function parseSamsungZip(bytes: Uint8Array): SamsungImportResult {
  const entries = unzipSync(bytes, {
    filter: (file) => file.name.toLowerCase().endsWith(".csv"),
  });
  const files: Record<string, string> = {};
  for (const [name, data] of Object.entries(entries))
    files[name] = strFromU8(data);
  return parseSamsungFiles(files);
}
