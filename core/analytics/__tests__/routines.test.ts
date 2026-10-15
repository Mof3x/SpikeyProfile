import { runAnalytics } from "../index";
import { generateSyntheticData } from "../demoData";
import { analyzeCycle } from "../cycle";
import { analyzeMedications } from "../medications";
import { addDays, dayKey, formatClock } from "../dates";

const NOW = new Date(2026, 9, 15, 12, 0, 0);

describe("medication timing", () => {
  const data = generateSyntheticData({
    days: 120,
    seed: 9,
    now: NOW,
    gaps: "none",
  });
  const meds = analyzeMedications(
    data.input.quickLogActions,
    data.input.quickLogEntries,
    NOW,
  );
  const morning = meds.find((m) => m.name === "Morning Meds")!;
  const evening = meds.find((m) => m.name === "Evening Meds")!;

  test("learns the usual time (about 8:30am)", () => {
    expect(morning.daily).toBe(true);
    expect(Math.abs(morning.usualMinutes! - 510)).toBeLessThanOrEqual(15);
    expect(formatClock(morning.usualMinutes!)).toMatch(/^8:\d\dam$/);
  });

  test("flags a dose as late once the usual window has passed", () => {
    const later = new Date(2026, 9, 15, 11, 30);
    const withoutToday = data.input.quickLogEntries.filter(
      (e) => dayKey(new Date(e.timestamp)) !== dayKey(later),
    );
    const late = analyzeMedications(
      data.input.quickLogActions,
      withoutToday,
      later,
    ).find((m) => m.name === "Morning Meds")!;
    expect(late.lateToday).toBe(true);
    const early = analyzeMedications(
      data.input.quickLogActions,
      withoutToday,
      new Date(2026, 9, 15, 7, 0),
    ).find((m) => m.name === "Morning Meds")!;
    expect(early.lateToday).toBe(false);
  });

  test("spots the Friday pattern for Evening Meds", () => {
    expect(evening.weakWeekday?.weekday).toBe(5);
    expect(morning.weakWeekday).toBeUndefined();
  });
});

describe("cycle maths", () => {
  const today = dayKey(NOW);
  const regularDays = new Set<string>();
  const starts = [-84, -56, -28].map((o) => addDays(today, o));
  starts.forEach((s) => {
    for (let k = 0; k < 5; k++) regularDays.add(addDays(s, k));
  });

  test("predicts the next period for a regular cycle", () => {
    const cycle = analyzeCycle(regularDays, today, "25-34");
    expect(cycle.starts).toEqual(starts);
    expect(cycle.medianLength).toBe(28);
    expect(cycle.irregular).toBe(false);
    expect(cycle.predictedNextStart).toBe(today);
    const state = cycle.stateFor(addDays(today, -3))!;
    expect(state.premenstrual).toBe(true);
    expect(state.daysUntilNext).toBe(3);
  });

  test("treats a varying cycle as irregular and widens the range", () => {
    const irregularDays = new Set<string>();
    [-120, -95, -55, -33, -2].forEach((o) => {
      for (let k = 0; k < 4; k++) irregularDays.add(addDays(today, o + k));
    });
    const cycle = analyzeCycle(irregularDays, today, "25-34");
    expect(cycle.irregular).toBe(true);
    const [lo, hi] = cycle.predictedRange!;
    expect(hi > lo).toBe(true);
  });

  test("expects irregular cycles from 45 upwards", () => {
    expect(analyzeCycle(regularDays, today, "45-54").irregular).toBe(true);
  });
});

describe("routines and quiet spells", () => {
  // About ten months: period-related gaps need several cycles before they're distinguishable from chance.
  const planted = generateSyntheticData({
    days: 300,
    seed: 21,
    now: NOW,
    gaps: "planted",
  });
  const result = runAnalytics(planted.input);

  test("finds the regular routines", () => {
    const ids = result.engagement.routines.map((r) => r.id);
    expect(ids).toContain("checkin");
    expect(ids).toContain("log.morning meds");
  });

  test("labels quiet spells and infers period-related ones", () => {
    expect(result.engagement.spells.length).toBeGreaterThanOrEqual(4);
    const periodLinked = result.engagement.spells.filter((s) =>
      s.reasons.some((r) => r.reason === "period"),
    );
    expect(periodLinked.length).toBeGreaterThan(0);
  });

  test("finds what leads up to going quiet", () => {
    const ids = result.engagement.leadUps.map((l) => l.id);
    expect(ids).toContain("quiet.loadRising");
    expect(ids).toContain("quiet.periodSoon");
    const period = result.engagement.leadUps.find(
      (l) => l.id === "quiet.periodSoon",
    )!;
    expect(period.plain).toBe(
      "You often go quiet on logging around the start of your period.",
    );
  });

  test("finds nothing when gaps are random", () => {
    const random = generateSyntheticData({
      days: 200,
      seed: 21,
      now: NOW,
      gaps: "random",
    });
    const r = runAnalytics(random.input);
    expect(r.engagement.spells.length).toBeGreaterThanOrEqual(4);
    expect(r.engagement.leadUps.filter((l) => l.outcome === "quiet")).toEqual(
      [],
    );
  });
});

describe("feeling better → meds slip", () => {
  const data = generateSyntheticData({
    days: 190,
    seed: 4,
    now: NOW,
    gaps: "none",
    drift: true,
  });
  const result = runAnalytics(data.input);
  const morning = result.drift.find((d) => d.name === "Morning Meds")!;

  test("finds two drop-offs that followed good stretches", () => {
    expect(
      morning.episodes.filter((e) => e.goodStretchBefore).length,
    ).toBeGreaterThanOrEqual(2);
    expect(morning.pattern).toBe(true);
    expect(morning.patternInsight!.plain).toMatch(
      /^Two times before, after about \w+ weeks of steady Morning Meds/,
    );
  });

  test("doesn't invent a pattern for steady logging", () => {
    const evening = result.drift.find((d) => d.name === "Evening Meds");
    expect(evening?.pattern ?? false).toBe(false);
  });
});

describe("welcome back after a break", () => {
  test("asks about a break that ended yesterday once something is logged today", () => {
    const data = generateSyntheticData({
      days: 40,
      seed: 2,
      now: NOW,
      gaps: "none",
    });
    const today = dayKey(NOW);
    const gap = new Set([
      addDays(today, -1),
      addDays(today, -2),
      addDays(today, -3),
    ]);
    const quiet = <T extends { timestamp: Date }>(items: T[]) =>
      items.filter((e) => !gap.has(dayKey(new Date(e.timestamp))));
    const input = {
      ...data.input,
      symptomEntries: quiet(data.input.symptomEntries),
      quickLogEntries: quiet(data.input.quickLogEntries),
      intakeEntries: quiet(data.input.intakeEntries),
      exerciseEntries: quiet(data.input.exerciseEntries),
      customTrackerEntries: quiet(data.input.customTrackerEntries),
      todos: data.input.todos.filter(
        (t) => !gap.has(dayKey(new Date(t.completedAt ?? t.createdAt))),
      ),
      focusSessions: data.input.focusSessions.filter(
        (f) => !gap.has(dayKey(new Date(f.endedAt))),
      ),
      periodDays: data.input.periodDays.filter((p) => !gap.has(p.date)),
    };
    // Nothing logged today yet: the break is still going, so no card.
    expect(runAnalytics(input).engagement.welcomeBack).toBeUndefined();
    // Log something today: the card asks about the three quiet days.
    const back = runAnalytics({
      ...input,
      quickLogEntries: [
        ...input.quickLogEntries,
        {
          id: "today",
          actionId: "3",
          actionName: "Drank Water",
          timestamp: new Date(NOW),
        },
      ],
    }).engagement.welcomeBack;
    expect(back).toBeDefined();
    expect(back!.start).toBe(addDays(today, -3));
    expect(back!.end).toBe(addDays(today, -1));
  });
});
