import type { CalendarEvent, DayNote, DayNoteReason } from "@/core/DataContext";
import type { CycleInfo } from "./cycle";
import { realSymptomEntries } from "./dailyFeatures";
import {
  addDays,
  dayKey,
  describeTimeOfDay,
  formatClock,
  formatDayShort,
  minutesOfDay,
  toDate,
  WEEKDAY_NAMES,
  weekdayOf,
  type DayKey,
} from "./dates";
import {
  benjaminiHochberg,
  circularIqr,
  circularMedian,
  fitLogistic,
  mean,
  median,
  midranks,
  modeShare,
  predictLogistic,
  seededRandom,
  shuffleInPlace,
  slope,
  spearman,
} from "./stats";
import { fmt } from "./text";
import type { AnalyticsInput, DailyTable } from "./types";

const ROUTINE_WINDOW = 28;
const ROUTINE_RATE = 0.6;
const MIN_SPELLS = 4;
const MIN_FEATURE_DAYS = 14;
const PERMUTATIONS = 999;
const AWAY_WORDS = /holiday|vacation|trip|travel|away|flight|festival|camping/i;

export interface Routine {
  id: string;
  label: string;
  rate: number;
  loggedDays: number;
  windowDays: number;
  usualMinutes?: number;
  windowEnd?: number;
  loggedToday: boolean;
  skipWeekday?: { weekday: number; skipped: number; total: number };
  plain: string;
  numbers: string;
}

export interface SpellReason {
  reason: DayNoteReason;
  inferred: boolean;
}

export interface QuietSpell {
  start: DayKey;
  end: DayKey;
  length: number;
  ongoing: boolean;
  noted: boolean;
  reasons: SpellReason[];
}

export interface LeadUpFinding {
  id: string;
  outcome: "quiet" | "skipCheckin";
  plain: string;
  numbers: string;
  effect: number;
}

export interface QuietRisk {
  probability: number;
  baseRate: number;
  warn: boolean;
  reasons: string[];
  plain: string;
  numbers: string;
}

export interface EngagementSummary {
  routines: Routine[];
  spells: QuietSpell[];
  leadUps: LeadUpFinding[];
  quietRisk?: QuietRisk;
  welcomeBack?: QuietSpell;
  biasWarning?: { plain: string; numbers: string };
  activeDayCount: number;
}

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? "many";
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

interface RoutineSource {
  id: string;
  label: string;
  /** Log times by day (first log of the day). */
  times: Map<DayKey, number>;
}

function routineSources(input: AnalyticsInput): RoutineSource[] {
  const sources: RoutineSource[] = [];
  const addTime = (map: Map<DayKey, number>, t: Date) => {
    const day = dayKey(t);
    const m = minutesOfDay(t);
    if (!map.has(day) || m < map.get(day)!) map.set(day, m);
  };

  const checkins = new Map<DayKey, number>();
  realSymptomEntries(input.symptomEntries).forEach((e) =>
    addTime(checkins, toDate(e.timestamp)),
  );
  sources.push({ id: "checkin", label: "Your check-in", times: checkins });

  const byName = new Map<string, RoutineSource>();
  for (const e of input.quickLogEntries) {
    const key = e.actionName.trim().toLowerCase();
    let src = byName.get(key);
    if (!src) {
      src = { id: `log.${key}`, label: e.actionName.trim(), times: new Map() };
      byName.set(key, src);
    }
    addTime(src.times, toDate(e.timestamp));
  }
  sources.push(...byName.values());

  const food = new Map<DayKey, number>();
  input.intakeEntries
    .filter((e) => e.category === "meal" || e.category === "snack")
    .forEach((e) => addTime(food, toDate(e.timestamp)));
  if (food.size)
    sources.push({ id: "food", label: "Food logging", times: food });

  for (const tracker of input.customTrackers) {
    const times = new Map<DayKey, number>();
    input.customTrackerEntries
      .filter((e) => e.trackerId === tracker.id)
      .forEach((e) => addTime(times, toDate(e.timestamp)));
    if (times.size)
      sources.push({ id: `tracker.${tracker.id}`, label: tracker.name, times });
  }
  return sources;
}

function findRoutines(input: AnalyticsInput, table: DailyTable): Routine[] {
  if (!table.firstDay) return [];
  const yesterday = addDays(table.today, -1);
  const windowStart = addDays(table.today, -ROUTINE_WINDOW);
  const start = windowStart > table.firstDay ? windowStart : table.firstDay;
  // Routines are measured over days you used the app: quiet days are studied separately,
  // so they don't make a routine look skipped.
  const isActive = (d: DayKey) => table.byDay.get(d)?.active === true;
  const windowDays: DayKey[] = [];
  for (let d = start; d <= yesterday; d = addDays(d, 1))
    if (isActive(d)) windowDays.push(d);
  if (windowDays.length < 10) return [];

  const routines: Routine[] = [];
  for (const src of routineSources(input)) {
    const logged = windowDays.filter((d) => src.times.has(d)).length;
    const rate = logged / windowDays.length;
    if (rate < ROUTINE_RATE) continue;
    const recentTimes = windowDays
      .filter((d) => src.times.has(d))
      .map((d) => src.times.get(d)!);
    const usualMinutes =
      recentTimes.length >= 5 ? circularMedian(recentTimes) : undefined;
    const windowEnd =
      usualMinutes !== undefined
        ? usualMinutes + Math.max(45, circularIqr(recentTimes))
        : undefined;

    const firstLog = [...src.times.keys()].sort()[0];
    const skipped = new Array<number>(7).fill(0);
    const totals = new Array<number>(7).fill(0);
    for (let d = firstLog; d <= yesterday; d = addDays(d, 1)) {
      if (!isActive(d)) continue;
      const wd = weekdayOf(d);
      totals[wd]++;
      if (!src.times.has(d)) skipped[wd]++;
    }
    const overall =
      skipped.reduce((a, b) => a + b, 0) /
      Math.max(
        1,
        totals.reduce((a, b) => a + b, 0),
      );
    let skipWeekday: Routine["skipWeekday"];
    for (let wd = 0; wd < 7; wd++) {
      if (totals[wd] < 3 || skipped[wd] < 2) continue;
      const r = skipped[wd] / totals[wd];
      if (r < 0.5 || r < overall + 0.25) continue;
      if (!skipWeekday || r > skipWeekday.skipped / skipWeekday.total) {
        skipWeekday = { weekday: wd, skipped: skipped[wd], total: totals[wd] };
      }
    }

    const when =
      usualMinutes !== undefined ? ` ${describeTimeOfDay(usualMinutes)}` : "";
    const skipPlain = skipWeekday
      ? `, but on ${WEEKDAY_NAMES[skipWeekday.weekday]} you often don't`
      : "";
    const skipNumbers = skipWeekday
      ? ` · not logged on ${skipWeekday.skipped} of ${skipWeekday.total} ${WEEKDAY_NAMES[skipWeekday.weekday]}`
      : "";
    routines.push({
      id: src.id,
      label: src.label,
      rate,
      loggedDays: logged,
      windowDays: windowDays.length,
      usualMinutes,
      windowEnd,
      loggedToday: src.times.has(table.today),
      skipWeekday,
      plain: `${src.label} is part of your routine, usually${when}${skipPlain}.`,
      numbers: `${src.label}: logged on ${logged} of your last ${windowDays.length} days using the app${
        usualMinutes !== undefined
          ? `, usually around ${formatClock(usualMinutes)}`
          : ""
      }${skipNumbers}`,
    });
  }
  return routines;
}

function findSpells(
  table: DailyTable,
  notes: readonly DayNote[],
  cycle: CycleInfo,
  calendar: readonly CalendarEvent[],
  toughLine: number | undefined,
): QuietSpell[] {
  const spells: QuietSpell[] = [];
  const yesterday = addDays(table.today, -1);
  const notesByDay = new Map(notes.map((n) => [n.date, n]));
  const awayDays = new Set(
    calendar
      .filter((e) => AWAY_WORDS.test(e.title))
      .map((e) => dayKey(toDate(e.date))),
  );
  let runStart: DayKey | null = null;
  const rows = table.rows.filter((r) => r.day <= yesterday);
  const close = (start: DayKey, end: DayKey, ongoing: boolean) => {
    const days: DayKey[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    const reasons: SpellReason[] = [];
    const noted = days.some((d) => notesByDay.has(d));
    days.forEach((d) =>
      notesByDay.get(d)?.reasons.forEach((r) => {
        if (!reasons.some((x) => x.reason === r))
          reasons.push({ reason: r, inferred: false });
      }),
    );
    const near = [
      addDays(start, -1),
      ...days,
      addDays(start, 1),
      addDays(start, 2),
    ];
    if (
      !reasons.some((r) => r.reason === "period") &&
      near.some((d) => cycle.starts.includes(d) || cycle.periodDays.has(d))
    ) {
      reasons.push({ reason: "period", inferred: true });
    }
    if (
      !reasons.some((r) => r.reason === "busy") &&
      days.some((d) => awayDays.has(d))
    ) {
      reasons.push({ reason: "busy", inferred: true });
    }
    const before = [-3, -2, -1]
      .map((o) => table.byDay.get(addDays(start, o))?.load)
      .filter((v): v is number => v !== undefined);
    if (
      !reasons.some((r) => r.reason === "unwell") &&
      before.length >= 2 &&
      (slope(before) > 0.5 ||
        (toughLine !== undefined && before[before.length - 1] >= toughLine))
    ) {
      reasons.push({ reason: "unwell", inferred: true });
    }
    spells.push({ start, end, length: days.length, ongoing, noted, reasons });
  };
  for (const row of rows) {
    if (!row.active) {
      if (runStart === null) runStart = row.day;
    } else if (runStart !== null) {
      close(runStart, addDays(row.day, -1), false);
      runStart = null;
    }
  }
  // A spell reaching yesterday is only still going if nothing has been logged today either.
  if (runStart !== null) {
    close(runStart, yesterday, !table.byDay.get(table.today)?.active);
  }
  return spells;
}

interface LeadFeature {
  id: string;
  kind: "yesno" | "number";
  /** When the outcome is more likely with yes / high values. */
  highText: string;
  /** When the outcome is more likely with low values (number features only). */
  lowText?: string;
  value: (day: DayKey) => number | undefined;
}

function leadFeatures(
  table: DailyTable,
  cycle: CycleInfo,
  calendar: readonly CalendarEvent[],
  medianLoad: number,
): LeadFeature[] {
  const row = (d: DayKey) => table.byDay.get(d);
  const loadsBefore = (d: DayKey, n: number) =>
    Array.from(
      { length: n },
      (_, i) => row(addDays(d, i - n + 1))?.load,
    ).filter((v): v is number => v !== undefined);
  const awayDays = new Set(
    calendar
      .filter((e) => AWAY_WORDS.test(e.title))
      .map((e) => dayKey(toDate(e.date))),
  );
  const streak = (d: DayKey) => {
    let n = 0;
    let cursor = d;
    while (row(cursor)?.active) {
      n++;
      cursor = addDays(cursor, -1);
    }
    return n;
  };
  const features: LeadFeature[] = [
    {
      id: "loadRising",
      kind: "yesno",
      highText: "after a couple of days of symptoms getting heavier",
      value: (d) => {
        const l = loadsBefore(d, 3);
        return l.length >= 2 ? (slope(l) > 0.5 ? 1 : 0) : undefined;
      },
    },
    {
      id: "heavyDay",
      kind: "number",
      highText: "after heavier days",
      lowText: "after easier days",
      value: (d) => row(d)?.load,
    },
    {
      id: "goodStretch",
      kind: "yesno",
      highText: "after a stretch of feeling good",
      value: (d) => {
        const l = loadsBefore(d, 7);
        if (l.length < 5) return undefined;
        return l.filter((v) => v < medianLoad).length >=
          Math.ceil(l.length * 0.7)
          ? 1
          : 0;
      },
    },
    {
      id: "streak",
      kind: "number",
      highText: "after long logging streaks",
      lowText: "after you've only just started logging again",
      value: (d) => streak(d),
    },
    {
      id: "sleep",
      kind: "number",
      highText: "after long nights of sleep",
      lowText: "after short nights",
      value: (d) => row(d)?.values["sleep.hours"],
    },
    {
      id: "busyTomorrow",
      kind: "yesno",
      highText: "before busy days",
      value: (d) => {
        const v = row(addDays(d, 1))?.values["schedule.events"];
        return v === undefined ? undefined : v >= 2 ? 1 : 0;
      },
    },
    {
      id: "away",
      kind: "yesno",
      highText: "when you're away or travelling",
      value: (d) =>
        awayDays.size === 0 ? undefined : awayDays.has(addDays(d, 1)) ? 1 : 0,
    },
    {
      id: "alcohol",
      kind: "number",
      highText: "after drinking",
      value: (d) => row(d)?.values["sub.alcohol.amount"],
    },
  ];
  if (cycle.hasData) {
    features.push({
      id: "periodSoon",
      kind: "yesno",
      // Logged starts can land late when the first period days went unlogged, so this can't
      // separate "just before" from "at the start"; the wording says "around".
      highText: "around the start of your period",
      value: (d) => {
        const s1 = cycle.stateFor(addDays(d, 1));
        if (!s1) return undefined;
        // A logged start can land a day or two late when the first period days went unlogged.
        const soon =
          s1.onPeriod ||
          [1, 2, 3, 4].some((k) => cycle.starts.includes(addDays(d, k))) ||
          (s1.daysUntilNext !== undefined && s1.daysUntilNext <= 1);
        return soon ? 1 : 0;
      },
    });
  }
  for (const id of [
    "weather.pressureDrop",
    "weather.hotDay",
    "weather.rainHours",
  ]) {
    const factor = table.factorById.get(id);
    if (!factor) continue;
    features.push({
      id,
      kind: factor.kind,
      highText: `before days with ${factor.label.toLowerCase()}`,
      lowText:
        factor.kind === "number"
          ? `before days with less ${factor.label.toLowerCase()}`
          : undefined,
      value: (d) => row(addDays(d, 1))?.values[id],
    });
  }
  return features;
}

function analyseLeadUps(
  table: DailyTable,
  features: LeadFeature[],
  outcome: "quiet" | "skipCheckin",
  outcomeOf: (day: DayKey) => number | undefined,
): { findings: LeadUpFinding[]; days: DayKey[]; ys: number[] } {
  const yesterday = addDays(table.today, -1);
  const days: DayKey[] = [];
  const ys: number[] = [];
  for (const row of table.rows) {
    if (!row.active || row.day >= yesterday) continue;
    const y = outcomeOf(row.day);
    if (y === undefined) continue;
    days.push(row.day);
    ys.push(y);
  }
  const positives = ys.filter((y) => y === 1).length;
  if (positives < MIN_SPELLS) return { findings: [], days, ys };

  // Quiet spells are rare events, so p-values come from shuffling the outcomes (permutation tests),
  // which stay honest with small counts where normal approximations overstate certainty.
  const random = seededRandom(1234);
  const tests: (LeadUpFinding & { p: number })[] = [];
  for (const f of features) {
    const xs: number[] = [];
    const yy: number[] = [];
    days.forEach((d, i) => {
      const v = f.value(d);
      if (v === undefined) return;
      xs.push(v);
      yy.push(ys[i]);
    });
    if (xs.length < MIN_FEATURE_DAYS || modeShare(xs) > 0.95) continue;
    if (f.kind === "yesno") {
      const yesIdx = xs.map((x, i) => (x > 0 ? i : -1)).filter((i) => i >= 0);
      const noIdx = xs.map((x, i) => (x > 0 ? -1 : i)).filter((i) => i >= 0);
      if (yesIdx.length < 3 || noIdx.length < 5) continue;
      const k1 = yesIdx.filter((i) => yy[i] === 1).length;
      const k0 = noIdx.filter((i) => yy[i] === 1).length;
      const p1 = k1 / yesIdx.length;
      const p0 = k0 / noIdx.length;
      const pooled = (k1 + k0) / (yesIdx.length + noIdx.length);
      const se = Math.sqrt(
        pooled * (1 - pooled) * (1 / yesIdx.length + 1 / noIdx.length),
      );
      if (se === 0 || p1 <= p0) continue;
      const shuffled = [...yy];
      let asExtreme = 0;
      for (let k = 0; k < PERMUTATIONS; k++) {
        shuffleInPlace(shuffled, random);
        let hits = 0;
        for (const i of yesIdx) hits += shuffled[i];
        if (hits >= k1) asExtreme++;
      }
      const label = outcome === "quiet" ? "quiet spells" : "skipped check-ins";
      tests.push({
        id: `${outcome}.${f.id}`,
        outcome,
        p: (asExtreme + 1) / (PERMUTATIONS + 1),
        effect: p1 - p0,
        plain:
          outcome === "quiet"
            ? `You often go quiet on logging ${f.highText}.`
            : `You often skip your check-in ${f.highText}.`,
        numbers: `${k1} of your ${k1 + k0} ${label} began ${f.highText} (${pct(p1)} of those days vs ${pct(p0)} of other days)`,
      });
    } else {
      const r = spearman(xs, yy);
      if (!Number.isFinite(r)) continue;
      const text = r > 0 ? f.highText : f.lowText;
      if (!text) continue;
      const ranks = midranks(xs);
      const rankMean = mean(ranks);
      const centred = ranks.map((v) => v - rankMean);
      const statistic = (ys2: number[]) =>
        ys2.reduce((sum, y, i) => sum + y * centred[i], 0);
      const observed = Math.abs(statistic(yy));
      const shuffled = [...yy];
      let asExtreme = 0;
      for (let k = 0; k < PERMUTATIONS; k++) {
        shuffleInPlace(shuffled, random);
        if (Math.abs(statistic(shuffled)) >= observed - 1e-9) asExtreme++;
      }
      tests.push({
        id: `${outcome}.${f.id}`,
        outcome,
        p: (asExtreme + 1) / (PERMUTATIONS + 1),
        effect: Math.abs(r),
        plain:
          outcome === "quiet"
            ? `You often go quiet on logging ${text}.`
            : `You often skip your check-in ${text}.`,
        numbers: `Link between this and ${outcome === "quiet" ? "going quiet" : "skipping check-ins"}: ρ ${fmt(r, 2)} over ${xs.length} days`,
      });
    }
  }
  const q = benjaminiHochberg(tests.map((t) => t.p));
  const findings = tests
    .filter((_, i) => q[i] <= 0.1)
    .sort((a, b) => b.effect - a.effect)
    .map(({ p: _p, ...rest }) => rest);
  return { findings, days, ys };
}

export function analyzeEngagement(
  input: AnalyticsInput,
  table: DailyTable,
  cycle: CycleInfo,
  toughLine: number | undefined,
): EngagementSummary {
  const empty: EngagementSummary = {
    routines: [],
    spells: [],
    leadUps: [],
    activeDayCount: 0,
  };
  if (!table.firstDay) return empty;

  const activeDayCount = table.rows.filter((r) => r.active).length;
  const routines = findRoutines(input, table);
  const spells = findSpells(
    table,
    input.dayNotes,
    cycle,
    input.calendarEvents,
    toughLine,
  );
  const loads = table.rows
    .filter((r) => !r.future && r.load !== undefined)
    .map((r) => r.load!);
  const medianLoad = loads.length ? median(loads) : 5;
  const features = leadFeatures(table, cycle, input.calendarEvents, medianLoad);

  const quiet = analyseLeadUps(table, features, "quiet", (d) => {
    const next = table.byDay.get(addDays(d, 1));
    return next && !next.future ? (next.active ? 0 : 1) : undefined;
  });
  const leadUps = [...quiet.findings];

  const checkinRate = activeDayCount
    ? table.rows.filter((r) => r.active && r.load !== undefined).length /
      activeDayCount
    : 0;
  if (checkinRate >= 0.5) {
    const skip = analyseLeadUps(table, features, "skipCheckin", (d) => {
      const next = table.byDay.get(addDays(d, 1));
      if (!next || next.future || !next.active) return undefined;
      return next.load === undefined ? 1 : 0;
    });
    leadUps.push(...skip.findings);
  }

  let quietRisk: QuietRisk | undefined;
  const positives = quiet.ys.filter((y) => y === 1).length;
  if (positives >= MIN_SPELLS && quiet.days.length >= 21) {
    const usable = features.filter(
      (f) =>
        quiet.days.filter((d) => f.value(d) !== undefined).length >=
        MIN_FEATURE_DAYS,
    );
    if (usable.length > 0) {
      const means = usable.map((f) => {
        const vals = quiet.days
          .map(f.value)
          .filter((v): v is number => v !== undefined);
        return vals.length ? mean(vals) : 0;
      });
      const X = quiet.days.map((d) =>
        usable.map((f, j) => f.value(d) ?? means[j]),
      );
      const model = fitLogistic(X, quiet.ys, 2);
      const todayX = usable.map((f, j) => f.value(table.today) ?? means[j]);
      const probability = predictLogistic(model, todayX);
      const baseRate = positives / quiet.ys.length;
      const warn = probability >= 0.5 && probability >= 2 * baseRate;
      const reasons = quiet.findings
        .filter((finding) => {
          const feature = usable.find((f) => finding.id === `quiet.${f.id}`);
          if (!feature) return false;
          const v = feature.value(table.today);
          return feature.kind === "yesno" ? v === 1 : v !== undefined;
        })
        .map((finding) =>
          finding.plain
            .replace(/^You often go quiet on logging /, "")
            .replace(/\.$/, ""),
        );
      quietRisk = {
        probability,
        baseRate,
        warn,
        reasons,
        plain: warn
          ? `Logging might feel harder over the next day or two${
              reasons.length ? ` (you often go quiet ${reasons[0]})` : ""
            }. One-tap check-ins can keep things going with less effort.`
          : "Nothing suggests you're about to go quiet on logging.",
        numbers: `Chance of a quiet day tomorrow: ${pct(probability)} (your usual rate is ${pct(baseRate)})`,
      };
    }
  }

  let biasWarning: EngagementSummary["biasWarning"];
  const spellStarts = new Set(spells.map((s) => addDays(s.start, -1)));
  const beforeLoads = [...spellStarts]
    .map((d) => table.byDay.get(d)?.load)
    .filter((v): v is number => v !== undefined);
  const otherLoads = table.rows
    .filter((r) => r.active && r.load !== undefined && !spellStarts.has(r.day))
    .map((r) => r.load!);
  if (
    beforeLoads.length >= MIN_SPELLS &&
    otherLoads.length >= 10 &&
    mean(beforeLoads) - mean(otherLoads) >= 0.5
  ) {
    biasWarning = {
      plain:
        "You tend to log less on harder days, so your averages may look a bit better than things really were.",
      numbers: `Load on the day before a quiet spell averaged ${fmt(mean(beforeLoads))} vs ${fmt(mean(otherLoads))} on other days`,
    };
  }

  const recentCutoff = addDays(table.today, -7);
  const welcomeBack = [...spells]
    .reverse()
    .find(
      (s) => !s.ongoing && s.length >= 2 && !s.noted && s.end >= recentCutoff,
    );

  return {
    routines,
    spells,
    leadUps,
    quietRisk,
    welcomeBack,
    biasWarning,
    activeDayCount,
  };
}

export function describeSpell(spell: QuietSpell): string {
  return spell.length === 1
    ? formatDayShort(spell.start)
    : `${formatDayShort(spell.start)} – ${formatDayShort(spell.end)}`;
}
