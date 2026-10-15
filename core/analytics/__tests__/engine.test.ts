import { runAnalytics } from "../index";
import { generateSyntheticData } from "../demoData";
import { buildDailyTable } from "../dailyFeatures";
import { analyzeCycle } from "../cycle";
import { addDays, dayKey } from "../dates";
import { DEFAULT_INTAKE_CONFIG } from "@/core/dataConstants";
import type { AnalyticsInput } from "../types";

const NOW = new Date(2026, 9, 15, 12, 0, 0);

const planted = generateSyntheticData({
  days: 150,
  seed: 7,
  now: NOW,
  gaps: "none",
});
const plantedResult = runAnalytics(planted.input);

const found = (factorId: string, outcome: string) =>
  plantedResult.correlations.results.some(
    (r) => r.factor.id === factorId && r.symptom.key === outcome,
  );

describe("pattern finder on data with planted effects", () => {
  test("finds sleep → energy", () => {
    expect(found("sleep.hours", "energy")).toBe(true);
  });

  test("finds exercise → mood", () => {
    expect(
      found("activity.exercised", "mood") ||
        found("activity.exerciseMinutes", "mood"),
    ).toBe(true);
  });

  test("finds a pressure drop → brain fog", () => {
    expect(
      found("weather.pressureDrop", "brainFog") ||
        found("weather.pressureChange", "brainFog"),
    ).toBe(true);
  });

  test("finds premenstrual days → sensory overload", () => {
    expect(found("cycle.premenstrual", "sensoryOverload")).toBe(true);
  });

  test("finds humidity → sensory overload", () => {
    expect(
      found("weather.humidity", "sensoryOverload") ||
        found("weather.dewPoint", "sensoryOverload"),
    ).toBe(true);
  });

  test("finds afternoon caffeine → shorter sleep that night", () => {
    expect(found("sub.caffeine.late", "sleep")).toBe(true);
  });

  test("finds alcohol → lower mood the next day", () => {
    const r = plantedResult.correlations.results.find(
      (c) => c.factor.id === "sub.alcohol.amount" && c.symptom.key === "mood",
    );
    expect(r).toBeDefined();
    expect(r!.lag).toBe(1);
    expect(r!.symptomUp).toBe(false);
  });

  test("finds skipped breakfast → executive dysfunction (reported once for the meals family)", () => {
    const meals = plantedResult.correlations.results.filter(
      (r) =>
        r.factor.family === "meals" && r.symptom.key === "executiveDysfunction",
    );
    expect(meals).toHaveLength(1);
  });

  test("reports related weather measures once per symptom", () => {
    const pressure = plantedResult.correlations.results.filter(
      (r) =>
        r.factor.family === "weather.pressure" && r.symptom.key === "brainFog",
    );
    expect(pressure).toHaveLength(1);
  });

  test("describes the right direction in plain words", () => {
    const sleep = plantedResult.correlations.results.find(
      (r) => r.factor.id === "sleep.hours" && r.symptom.key === "energy",
    )!;
    expect(sleep.plain).toBe(
      "You tend to have more energy after nights with more sleep.",
    );
    expect(sleep.good).toBe(true);
  });

  test("plain-words text never contains digits", () => {
    for (const insight of plantedResult.insights) {
      expect(insight.plain ?? insight.description).not.toMatch(/\d/);
    }
    for (const f of plantedResult.forecastToday.symptoms)
      expect(f.plain).not.toMatch(/\d/);
  });
});

describe("pattern finder on pure noise", () => {
  test("reports nothing after the false-discovery correction", () => {
    const noise = generateSyntheticData({
      days: 150,
      seed: 11,
      now: NOW,
      effects: false,
      gaps: "none",
    });
    const result = runAnalytics(noise.input);
    expect(result.correlations.results.map((r) => r.id)).toEqual([]);
    expect(result.correlations.testedCount).toBeGreaterThan(100);
  });
});

describe("forecasts", () => {
  test("beat the recent-average baseline when there's signal", () => {
    const energy = plantedResult.forecastToday.symptoms.find(
      (s) => s.target === "energy",
    )!;
    expect(energy.method).toBe("model");
    expect(energy.modelMae!).toBeLessThan(energy.baselineMae!);
  });

  test("fall back to the recent average on noise", () => {
    const noise = generateSyntheticData({
      days: 150,
      seed: 23,
      now: NOW,
      effects: false,
      gaps: "none",
    });
    const result = runAnalytics(noise.input);
    const methods = result.forecastToday.symptoms.map((s) => s.method);
    expect(methods.filter((m) => m === "model").length).toBeLessThanOrEqual(1);
  });

  test("need three weeks of data before modelling", () => {
    const short = generateSyntheticData({
      days: 15,
      seed: 3,
      now: NOW,
      gaps: "none",
    });
    const result = runAnalytics(short.input);
    expect(result.forecastToday.ready).toBe(false);
    expect(
      result.forecastToday.symptoms.every((s) => s.method !== "model"),
    ).toBe(true);
  });
});

describe("didn't do it vs didn't log it", () => {
  const today = dayKey(NOW);
  const d = (offset: number) => addDays(today, offset);
  const at = (day: string, hour: number) => {
    const [y, m, dd] = day.split("-").map(Number);
    return new Date(y, m - 1, dd, hour, 0, 0);
  };
  const base: AnalyticsInput = {
    now: NOW,
    symptomEntries: [
      {
        id: "a",
        timestamp: at(d(-5), 20),
        mood: 5,
        energy: 5,
        brainFog: 5,
        sensoryOverload: 5,
        executiveDysfunction: 5,
      },
      {
        id: "b",
        timestamp: at(d(-3), 20),
        mood: 6,
        energy: 5,
        brainFog: 5,
        sensoryOverload: 5,
        executiveDysfunction: 5,
      },
      {
        id: "c",
        timestamp: at(d(-1), 20),
        mood: 4,
        energy: 5,
        brainFog: 5,
        sensoryOverload: 5,
        executiveDysfunction: 5,
        source: "quickTap",
      },
      {
        id: "1",
        timestamp: at(d(-2), 20),
        mood: 9,
        energy: 9,
        brainFog: 1,
        sensoryOverload: 1,
        executiveDysfunction: 1,
      },
    ],
    quickLogActions: [],
    quickLogEntries: [],
    todos: [],
    calendarEvents: [],
    countdownTimers: [],
    customTrackers: [],
    customTrackerEntries: [],
    exerciseEntries: [
      {
        id: "e",
        timestamp: at(d(-5), 18),
        type: "walk",
        minutes: 30,
        intensity: 2,
      },
    ],
    intakeEntries: [],
    intakeConfig: DEFAULT_INTAKE_CONFIG,
    focusSessions: [],
    periodDays: [],
    dayNotes: [],
    ageRange: null,
    external: [],
  };
  const cycle = analyzeCycle(new Set(), today, null);
  const table = buildDailyTable(base, { meds: [], cycle });

  test("days you used the app without exercising count as no exercise", () => {
    expect(table.byDay.get(d(-5))!.values["activity.exercised"]).toBe(1);
    expect(table.byDay.get(d(-3))!.values["activity.exercised"]).toBe(0);
  });

  test("days you didn't open the app are unknown, not zero", () => {
    expect(table.byDay.get(d(-4))!.active).toBe(false);
    expect(
      table.byDay.get(d(-4))!.values["activity.exercised"],
    ).toBeUndefined();
  });

  test("quick-tap placeholders and old sample entries are ignored as symptoms", () => {
    expect(table.byDay.get(d(-1))!.active).toBe(true);
    expect(table.byDay.get(d(-1))!.load).toBeUndefined();
    expect(table.byDay.get(d(-2))!.load).toBeUndefined();
  });
});

test("runs fast enough for a year of data", () => {
  const year = generateSyntheticData({ days: 365, seed: 5, now: NOW });
  const start = Date.now();
  runAnalytics(year.input);
  const elapsed = Date.now() - start;
  // Generous bound for CI; phones run this off the main interaction.
  expect(elapsed).toBeLessThan(8000);
});
