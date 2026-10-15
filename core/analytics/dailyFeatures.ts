import { SAMPLE_ENTRY_IDS } from "@/core/dataConstants";
import type {
  CalendarEvent,
  CountdownTimer,
  CustomTracker,
  SymptomEntry,
} from "@/core/DataContext";
import type { CycleInfo } from "./cycle";
import {
  addDays,
  dayKey,
  dayRange,
  minutesOfDay,
  parseDayKey,
  toDate,
  weekdayOf,
  type DayKey,
} from "./dates";
import type { MedPattern } from "./medications";
import { medicationLogs } from "./medications";
import {
  loadFromSymptoms,
  SYMPTOMS,
  type AnalyticsInput,
  type DailyRow,
  type DailyTable,
  type FactorDef,
  type SymptomKey,
} from "./types";

/** Symptom entries that reflect a real check-in (not a quick-tap placeholder or the old sample data). */
export function realSymptomEntries(
  entries: readonly SymptomEntry[],
): SymptomEntry[] {
  return entries.filter(
    (e) => e.source !== "quickTap" && !SAMPLE_ENTRY_IDS.has(e.id),
  );
}

const slug = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";

const APPOINTMENT_WORDS =
  /appointment|doctor|dentist|\bgp\b|clinic|hospital|therap|counsel|psychiat|nurse/i;

class FactorStore {
  defs = new Map<string, FactorDef>();
  values = new Map<string, Map<DayKey, number>>();
  manualStart = new Map<string, DayKey>();

  define(def: FactorDef) {
    if (!this.defs.has(def.id)) {
      this.defs.set(def.id, def);
      this.values.set(def.id, new Map());
    }
  }

  set(id: string, day: DayKey, value: number) {
    this.values.get(id)?.set(day, value);
  }

  add(id: string, day: DayKey, delta: number) {
    const map = this.values.get(id);
    if (!map) return;
    map.set(day, (map.get(day) ?? 0) + delta);
  }

  markStart(id: string, day: DayKey) {
    const current = this.manualStart.get(id);
    if (!current || day < current) this.manualStart.set(id, day);
  }
}

function expandRecurring(
  base: DayKey,
  rule: "daily" | "weekly" | "monthly" | null | undefined,
  from: DayKey,
  to: DayKey,
): DayKey[] {
  if (!rule) return base >= from && base <= to ? [base] : [];
  const out: DayKey[] = [];
  const baseDate = parseDayKey(base);
  for (const day of dayRange(base > from ? base : from, to)) {
    if (rule === "daily") out.push(day);
    else if (rule === "weekly" && weekdayOf(day) === baseDate.getDay())
      out.push(day);
    else if (
      rule === "monthly" &&
      parseDayKey(day).getDate() === baseDate.getDate()
    )
      out.push(day);
  }
  return out;
}

function countdownDays(
  timer: CountdownTimer,
  from: DayKey,
  to: DayKey,
): DayKey[] {
  const base = dayKey(toDate(timer.targetDate));
  if (!timer.recurrenceEnabled || !timer.recurrenceEvery) {
    return base >= from && base <= to ? [base] : [];
  }
  const step =
    timer.recurrenceEvery * (timer.recurrenceUnit === "weeks" ? 7 : 1);
  const end = timer.recurrenceEndDate
    ? dayKey(toDate(timer.recurrenceEndDate))
    : to;
  const out: DayKey[] = [];
  let day = base;
  let guard = 0;
  while (day <= to && day <= end && guard < 2000) {
    if (day >= from) out.push(day);
    day = addDays(day, step);
    guard++;
  }
  return out;
}

function trackerNumber(
  tracker: CustomTracker,
  value: string | number | boolean,
): number | undefined {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (tracker.inputType === "toggle") {
    const v = value.trim().toLowerCase();
    if (["yes", "true", "1", "y"].includes(v)) return 1;
    if (["no", "false", "0", "n"].includes(v)) return 0;
  }
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export interface BuildContext {
  meds: MedPattern[];
  cycle: CycleInfo;
}

export function buildDailyTable(
  input: AnalyticsInput,
  ctx: BuildContext,
): DailyTable {
  const today = dayKey(input.now);
  const tomorrow = addDays(today, 1);
  const store = new FactorStore();
  const activeDays = new Set<DayKey>();
  const markActive = (day: DayKey) => {
    if (day <= today) activeDays.add(day);
  };

  // --- Symptom check-ins and sleep -------------------------------------------------------
  const symptomSums = new Map<
    DayKey,
    { sums: Record<string, number>; counts: Record<string, number> }
  >();
  store.define({
    id: "sleep.hours",
    label: "Sleep",
    group: "sleep",
    kind: "number",
    unit: "h",
    more: "more sleep",
    less: "less sleep",
    dayPrefix: "after nights with",
    nextPrefix: "the day after nights with",
    testNextDay: true,
  });
  store.define({
    id: "sleep.quality",
    label: "Sleep quality",
    group: "sleep",
    kind: "number",
    more: "better sleep",
    less: "worse sleep",
    dayPrefix: "after nights with",
    nextPrefix: "the day after nights with",
    testNextDay: true,
  });
  const sleepSums = new Map<DayKey, { hours: number[]; quality: number[] }>();

  for (const entry of input.symptomEntries) {
    if (SAMPLE_ENTRY_IDS.has(entry.id)) continue;
    const day = dayKey(toDate(entry.timestamp));
    markActive(day);
    if (entry.source === "quickTap") continue;
    let bucket = symptomSums.get(day);
    if (!bucket) {
      bucket = { sums: {}, counts: {} };
      symptomSums.set(day, bucket);
    }
    for (const def of SYMPTOMS) {
      const v = entry[def.key];
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      bucket.sums[def.key] = (bucket.sums[def.key] ?? 0) + v;
      bucket.counts[def.key] = (bucket.counts[def.key] ?? 0) + 1;
    }
    if (entry.sleepHours !== undefined || entry.sleepQuality !== undefined) {
      const s = sleepSums.get(day) ?? { hours: [], quality: [] };
      if (entry.sleepHours !== undefined) s.hours.push(entry.sleepHours);
      if (entry.sleepQuality !== undefined) s.quality.push(entry.sleepQuality);
      sleepSums.set(day, s);
    }
  }
  for (const [day, s] of sleepSums) {
    if (s.hours.length) store.set("sleep.hours", day, Math.max(...s.hours));
    if (s.quality.length)
      store.set(
        "sleep.quality",
        day,
        s.quality.reduce((a, b) => a + b, 0) / s.quality.length,
      );
  }

  // --- Quick logs: medication and habits ---------------------------------------------------
  const medNames = new Set<string>();
  for (const med of ctx.meds) {
    medNames.add(med.name.trim().toLowerCase());
    const takenId = `med.${med.actionId}.taken`;
    store.define({
      id: takenId,
      family: `med.${med.actionId}`,
      label: `${med.name} logged`,
      group: "meds",
      kind: "yesno",
      manual: true,
      onDays: `on days you log ${med.name}`,
      dayAfter: `the day after you log ${med.name}`,
      testNextDay: true,
    });
    for (const day of med.logDays) {
      store.set(takenId, day, 1);
      store.markStart(takenId, day);
    }
    if (med.daily && med.windowEnd !== undefined) {
      const lateId = `med.${med.actionId}.late`;
      store.define({
        id: lateId,
        family: `med.${med.actionId}`,
        label: `${med.name} later than usual`,
        group: "meds",
        kind: "yesno",
        onDays: `on days ${med.name} is logged later than usual`,
        dayAfter: `the day after ${med.name} is logged later than usual`,
        testNextDay: true,
      });
      for (const [day, minutes] of med.firstLogMinutes) {
        store.set(lateId, day, minutes > med.windowEnd ? 1 : 0);
      }
    }
  }
  for (const action of input.quickLogActions) {
    if (action.category === "medication") {
      for (const e of medicationLogs(action, input.quickLogEntries))
        markActive(dayKey(toDate(e.timestamp)));
    }
  }

  const habitNames = new Map<string, string>();
  for (const entry of input.quickLogEntries) {
    const day = dayKey(toDate(entry.timestamp));
    markActive(day);
    const name = entry.actionName.trim();
    if (medNames.has(name.toLowerCase())) continue;
    const action = input.quickLogActions.find((a) => a.id === entry.actionId);
    if (action?.category === "medication") continue;
    const id = `habit.${slug(name)}`;
    if (!habitNames.has(id)) {
      habitNames.set(id, name);
      store.define({
        id,
        label: name,
        group: "habits",
        kind: "number",
        manual: true,
        more: `more "${name}" logs`,
        less: `fewer "${name}" logs`,
        onDays: `on days you log "${name}"`,
        dayAfter: `the day after you log "${name}"`,
        testNextDay: true,
      });
    }
    store.add(id, day, 1);
    store.markStart(id, day);
  }

  // --- Exercise -------------------------------------------------------------------------------
  const exerciseFactors: FactorDef[] = [
    {
      id: "activity.exerciseMinutes",
      family: "exercise",
      label: "Exercise",
      group: "activity",
      kind: "number",
      unit: "min",
      manual: true,
      more: "more exercise",
      less: "less exercise",
      testNextDay: true,
    },
    {
      id: "activity.exercised",
      family: "exercise",
      label: "Exercised",
      group: "activity",
      kind: "yesno",
      manual: true,
      onDays: "on days you exercise",
      dayAfter: "the day after you exercise",
      testNextDay: true,
    },
    {
      id: "activity.hardExercise",
      family: "exercise",
      label: "Hard exercise",
      group: "activity",
      kind: "yesno",
      manual: true,
      onDays: "on days with hard exercise",
      dayAfter: "the day after hard exercise",
      testNextDay: true,
    },
  ];
  if (input.exerciseEntries.length > 0) {
    exerciseFactors.forEach((f) => store.define(f));
    for (const e of input.exerciseEntries) {
      const day = dayKey(toDate(e.timestamp));
      markActive(day);
      store.add("activity.exerciseMinutes", day, e.minutes);
      store.set("activity.exercised", day, 1);
      if (e.intensity === 3) store.set("activity.hardExercise", day, 1);
      exerciseFactors.forEach((f) => store.markStart(f.id, day));
    }
  }

  // --- Focus sessions and to-dos -------------------------------------------------------------
  if (input.focusSessions.length > 0) {
    store.define({
      id: "focus.minutes",
      label: "Focus time",
      group: "activity",
      kind: "number",
      unit: "min",
      manual: true,
      more: "more focus time",
      less: "less focus time",
      testNextDay: true,
    });
    for (const s of input.focusSessions) {
      const day = dayKey(toDate(s.endedAt));
      markActive(day);
      store.add("focus.minutes", day, s.minutes);
      store.markStart("focus.minutes", day);
    }
  }

  const doneTodos = input.todos.filter((t) => t.completed && t.completedAt);
  if (doneTodos.length > 0) {
    store.define({
      id: "schedule.todosDone",
      label: "Tasks done",
      group: "schedule",
      kind: "number",
      manual: true,
      more: "more tasks done",
      less: "fewer tasks done",
      testNextDay: true,
    });
    for (const t of doneTodos) {
      const day = dayKey(toDate(t.completedAt!));
      markActive(day);
      store.add("schedule.todosDone", day, 1);
      store.markStart("schedule.todosDone", day);
    }
  }
  for (const t of input.todos) markActive(dayKey(toDate(t.createdAt)));

  // --- Food, drink and substances ------------------------------------------------------------
  const foodByDay = new Map<
    DayKey,
    {
      minutes: number[];
      meals: number;
      snacks: number;
      breakfast: boolean;
      tags: Set<string>;
    }
  >();
  const substancesById = new Map(
    input.intakeConfig.substances.map((s) => [s.id, s]),
  );
  for (const e of input.intakeEntries) {
    const t = toDate(e.timestamp);
    const day = dayKey(t);
    markActive(day);
    if (e.category === "meal" || e.category === "snack") {
      const f = foodByDay.get(day) ?? {
        minutes: [],
        meals: 0,
        snacks: 0,
        breakfast: false,
        tags: new Set<string>(),
      };
      f.minutes.push(minutesOfDay(t));
      if (e.category === "meal") f.meals++;
      else f.snacks++;
      if (
        e.item.toLowerCase() === "breakfast" ||
        (e.category === "meal" && minutesOfDay(t) < 11 * 60)
      )
        f.breakfast = true;
      (e.tags ?? []).forEach((tag) => f.tags.add(tag));
      foodByDay.set(day, f);
    } else if (e.category === "drink") {
      const id = `food.drink.${slug(e.item)}`;
      store.define({
        id,
        label: e.item,
        group: "food",
        kind: "number",
        manual: true,
        more: `more ${e.item.toLowerCase()}`,
        less: `less ${e.item.toLowerCase()}`,
        testNextDay: true,
      });
      store.add(id, day, e.amount ?? 1);
      store.markStart(id, day);
    } else if (e.category === "substance") {
      const def = substancesById.get(e.item);
      const name = def?.name ?? e.item;
      const amountId = `sub.${slug(e.item)}.amount`;
      store.define({
        id: amountId,
        family: `sub.${slug(e.item)}`,
        label: name,
        group: "substances",
        kind: "number",
        unit: def?.unit,
        manual: true,
        more: `more ${name.toLowerCase()}`,
        less: `less ${name.toLowerCase()}`,
        testNextDay: true,
      });
      store.add(amountId, day, e.amount ?? 1);
      store.markStart(amountId, day);
      if (def?.stimulant) {
        const lateId = `sub.${slug(e.item)}.late`;
        store.define({
          id: lateId,
          family: `sub.${slug(e.item)}`,
          label: `Afternoon ${name.toLowerCase()}`,
          group: "substances",
          kind: "yesno",
          manual: true,
          onDays: `on days you have ${name.toLowerCase()} in the afternoon or later`,
          dayAfter: `the day after having ${name.toLowerCase()} in the afternoon or later`,
          testNextDay: true,
        });
        store.markStart(lateId, day);
        if (minutesOfDay(t) >= 14 * 60) store.set(lateId, day, 1);
      }
    }
  }
  if (foodByDay.size > 0) {
    const foodDefs: FactorDef[] = [
      {
        id: "food.meals",
        family: "meals",
        label: "Meals",
        group: "food",
        kind: "number",
        manual: true,
        more: "more regular meals",
        less: "fewer meals",
        testNextDay: true,
      },
      {
        id: "food.skippedBreakfast",
        family: "meals",
        label: "Skipped breakfast",
        group: "food",
        kind: "yesno",
        onDays: "on days you skip breakfast",
        dayAfter: "the day after you skip breakfast",
        testNextDay: true,
      },
      {
        id: "food.lateEating",
        label: "Late-night eating",
        group: "food",
        kind: "yesno",
        onDays: "on days you eat late at night",
        dayAfter: "the day after eating late at night",
        testNextDay: true,
      },
      {
        id: "food.firstMealHour",
        family: "meals",
        label: "First meal time",
        group: "food",
        kind: "number",
        unit: "h",
        more: "a later first meal",
        less: "an earlier first meal",
        testNextDay: true,
      },
      {
        id: "food.longestGap",
        family: "meals",
        label: "Longest gap between meals",
        group: "food",
        kind: "number",
        unit: "h",
        more: "longer gaps between meals",
        less: "shorter gaps between meals",
        testNextDay: true,
      },
    ];
    foodDefs.forEach((d) => store.define(d));
    const allTags = new Set<string>();
    for (const f of foodByDay.values()) f.tags.forEach((t) => allTags.add(t));
    for (const tag of allTags) {
      store.define({
        id: `food.tag.${slug(tag)}`,
        label: `${tag} food`,
        group: "food",
        kind: "yesno",
        onDays: `on days with "${tag}" food`,
        dayAfter: `the day after "${tag}" food`,
        testNextDay: true,
      });
    }
    for (const [day, f] of foodByDay) {
      store.set("food.meals", day, f.meals);
      store.markStart("food.meals", day);
      store.set("food.skippedBreakfast", day, f.breakfast ? 0 : 1);
      const sortedMinutes = [...f.minutes].sort((a, b) => a - b);
      store.set(
        "food.lateEating",
        day,
        sortedMinutes[sortedMinutes.length - 1] >= 21 * 60 ? 1 : 0,
      );
      store.set("food.firstMealHour", day, sortedMinutes[0] / 60);
      if (sortedMinutes.length >= 2) {
        let gap = 0;
        for (let i = 1; i < sortedMinutes.length; i++)
          gap = Math.max(gap, sortedMinutes[i] - sortedMinutes[i - 1]);
        store.set("food.longestGap", day, gap / 60);
      }
      for (const tag of allTags)
        store.set(`food.tag.${slug(tag)}`, day, f.tags.has(tag) ? 1 : 0);
    }
  }

  // --- Custom trackers ---------------------------------------------------------------------------
  const trackersById = new Map(input.customTrackers.map((t) => [t.id, t]));
  const trackerValues = new Map<string, Map<DayKey, number[]>>();
  for (const e of input.customTrackerEntries) {
    const tracker = trackersById.get(e.trackerId);
    if (!tracker || tracker.inputType === "text") continue;
    const day = dayKey(toDate(e.timestamp));
    markActive(day);
    const n = trackerNumber(tracker, e.value);
    if (n === undefined) continue;
    const map = trackerValues.get(tracker.id) ?? new Map<DayKey, number[]>();
    map.set(day, [...(map.get(day) ?? []), n]);
    trackerValues.set(tracker.id, map);
  }
  for (const [trackerId, byDay] of trackerValues) {
    const tracker = trackersById.get(trackerId)!;
    const id = `tracker.${trackerId}`;
    const isCounter = tracker.inputType === "counter";
    const isToggle = tracker.inputType === "toggle";
    store.define({
      id,
      label: tracker.name,
      group: "trackers",
      kind: isToggle ? "yesno" : "number",
      manual: isCounter,
      more: `more ${tracker.name.toLowerCase()}`,
      less: `less ${tracker.name.toLowerCase()}`,
      onDays: `on days with ${tracker.name.toLowerCase()}`,
      dayAfter: `the day after ${tracker.name.toLowerCase()}`,
      testNextDay: true,
    });
    for (const [day, values] of byDay) {
      const v = isCounter
        ? values.reduce((a, b) => a + b, 0)
        : isToggle
          ? Math.max(...values)
          : values.reduce((a, b) => a + b, 0) / values.length;
      store.set(id, day, v);
      store.markStart(id, day);
    }
  }

  // --- Period days and day notes count as using the app ----------------------------------------
  input.periodDays.forEach((p) => markActive(p.date));
  input.dayNotes.forEach((n) => markActive(n.date));

  // --- Work out the table's date range ----------------------------------------------------------
  const allActive = [...activeDays].sort();
  if (allActive.length === 0) {
    return {
      rows: [],
      byDay: new Map(),
      factors: [],
      factorById: new Map(),
      today,
      firstDay: null,
    };
  }
  const firstDay = allActive[0];
  const days = dayRange(firstDay, tomorrow);

  // --- Calendar (known in advance) ----------------------------------------------------------------
  store.define({
    id: "schedule.weekend",
    label: "Weekend",
    group: "schedule",
    kind: "yesno",
    knownInAdvance: true,
    onDays: "at weekends",
    dayAfter: "the day after a weekend day",
  });
  for (const day of days) {
    const wd = weekdayOf(day);
    store.set("schedule.weekend", day, wd === 0 || wd === 6 ? 1 : 0);
  }

  const calendarItems: CalendarEvent[] = input.calendarEvents.filter(
    (e) => e.type !== "symptom",
  );
  if (calendarItems.length > 0 || input.countdownTimers.length > 0) {
    store.define({
      id: "schedule.events",
      family: "calendar",
      label: "Calendar events",
      group: "schedule",
      kind: "number",
      knownInAdvance: true,
      more: "a busier calendar",
      less: "a quieter calendar",
      nextPrefix: "the day after",
      testNextDay: true,
    });
    store.define({
      id: "schedule.appointment",
      family: "calendar",
      label: "Appointment",
      group: "schedule",
      kind: "yesno",
      knownInAdvance: true,
      onDays: "on appointment days",
      dayAfter: "the day after an appointment",
      testNextDay: true,
    });
    for (const day of days) {
      store.set("schedule.events", day, 0);
      store.set("schedule.appointment", day, 0);
    }
    for (const e of calendarItems) {
      for (const day of expandRecurring(
        dayKey(toDate(e.date)),
        e.recurring,
        firstDay,
        tomorrow,
      )) {
        store.add("schedule.events", day, 1);
        if (APPOINTMENT_WORDS.test(e.title))
          store.set("schedule.appointment", day, 1);
      }
    }
    for (const timer of input.countdownTimers) {
      if (!timer.enabled) continue;
      for (const day of countdownDays(timer, firstDay, tomorrow)) {
        store.add("schedule.events", day, 1);
        if (
          timer.category === "appointment" ||
          APPOINTMENT_WORDS.test(timer.name)
        ) {
          store.set("schedule.appointment", day, 1);
        }
      }
    }
  }

  // --- Cycle ------------------------------------------------------------------------------------------
  if (ctx.cycle.hasData) {
    const cycleDefs: FactorDef[] = [
      {
        id: "cycle.onPeriod",
        family: "cycle",
        label: "Period",
        group: "cycle",
        kind: "yesno",
        knownInAdvance: true,
        onDays: "on period days",
        dayAfter: "the day after a period day",
      },
      {
        id: "cycle.premenstrual",
        family: "cycle",
        label: "Week before your period",
        group: "cycle",
        kind: "yesno",
        knownInAdvance: true,
        onDays: "in the week before your period",
        dayAfter: "the day after a premenstrual day",
      },
      {
        id: "cycle.midCycle",
        family: "cycle",
        label: "Mid-cycle",
        group: "cycle",
        kind: "yesno",
        knownInAdvance: true,
        onDays: "around the middle of your cycle",
        dayAfter: "the day after mid-cycle",
      },
      {
        id: "cycle.daysSinceStart",
        family: "cycle",
        label: "Days since your period started",
        group: "cycle",
        kind: "number",
        knownInAdvance: true,
        more: "more days since your period started",
        less: "fewer days since your period started",
        dayPrefix: "with",
      },
    ];
    cycleDefs.forEach((d) => store.define(d));
    for (const day of days) {
      const state = ctx.cycle.stateFor(day);
      if (!state) continue;
      const known =
        day > today || activeDays.has(day) || ctx.cycle.periodDays.has(day);
      if (known) store.set("cycle.onPeriod", day, state.onPeriod ? 1 : 0);
      if (state.premenstrual !== undefined)
        store.set("cycle.premenstrual", day, state.premenstrual ? 1 : 0);
      if (state.midCycle !== undefined)
        store.set("cycle.midCycle", day, state.midCycle ? 1 : 0);
      if (state.daysSinceStart !== undefined)
        store.set("cycle.daysSinceStart", day, state.daysSinceStart);
    }
  }

  // --- External sources: weather, steps, health apps, imports -----------------------------------
  const mergeValues = new Map<string, Map<DayKey, number>>();
  for (const source of input.external) {
    for (const metric of source.metrics) {
      if (metric.key === "menstruationFlow") continue;
      if (metric.mergeInto) {
        const target =
          mergeValues.get(metric.mergeInto) ?? new Map<DayKey, number>();
        for (const [day, values] of Object.entries(source.days)) {
          const v = values[metric.key];
          if (v !== undefined && Number.isFinite(v) && !target.has(day))
            target.set(day, v);
        }
        mergeValues.set(metric.mergeInto, target);
        if (!store.defs.has(metric.mergeInto)) {
          store.define({
            id: metric.mergeInto,
            label: metric.label,
            group: metric.group,
            kind: metric.kind,
            unit: metric.unit,
            more: metric.more,
            less: metric.less,
            onDays: metric.onDays,
            dayAfter: metric.dayAfter,
            dayPrefix: metric.dayPrefix,
            nextPrefix: metric.nextPrefix,
            testNextDay: metric.testNextDay,
            family: metric.family,
          });
        }
        continue;
      }
      const id = `${source.id}.${metric.key}`;
      store.define({
        id,
        label: metric.label,
        group: metric.group,
        kind: metric.kind,
        unit: metric.unit,
        decimals: metric.decimals,
        more: metric.more,
        less: metric.less,
        onDays: metric.onDays,
        dayAfter: metric.dayAfter,
        dayPrefix: metric.dayPrefix,
        nextPrefix: metric.nextPrefix,
        knownInAdvance: metric.knownInAdvance,
        testNextDay: metric.testNextDay,
        family: metric.family ? `${source.id}.${metric.family}` : undefined,
      });
      for (const [day, values] of Object.entries(source.days)) {
        const v = values[metric.key];
        if (v !== undefined && Number.isFinite(v)) store.set(id, day, v);
      }
    }
  }

  // --- Habits that are only ever logged once a day read better as yes/no -----------------------------
  for (const id of habitNames.keys()) {
    const values = [...(store.values.get(id)?.values() ?? [])];
    if (values.every((v) => v <= 1)) {
      const def = store.defs.get(id)!;
      store.defs.set(id, { ...def, kind: "yesno" });
    }
  }

  // --- Assemble rows ------------------------------------------------------------------------------------
  const factors = [...store.defs.values()];
  const rows: DailyRow[] = days.map((day) => {
    const future = day > today;
    const active = activeDays.has(day);
    const symptoms: Partial<Record<SymptomKey, number>> = {};
    const bucket = symptomSums.get(day);
    if (bucket && !future) {
      for (const def of SYMPTOMS) {
        const c = bucket.counts[def.key];
        if (c) symptoms[def.key] = bucket.sums[def.key] / c;
      }
    }
    const values: Record<string, number> = {};
    for (const def of factors) {
      if (future && !def.knownInAdvance) continue;
      let v = store.values.get(def.id)?.get(day);
      if (v === undefined) {
        const merged = mergeValues.get(def.id)?.get(day);
        if (merged !== undefined) v = merged;
      }
      if (def.manual) {
        const start = store.manualStart.get(def.id);
        if (!start || day < start) {
          if (v !== undefined && v > 0) values[def.id] = v;
          continue;
        }
        if (v !== undefined)
          values[def.id] = def.kind === "yesno" ? (v > 0 ? 1 : 0) : v;
        else if (active) values[def.id] = 0;
        continue;
      }
      if (v !== undefined) values[def.id] = v;
    }
    return {
      day,
      future,
      active,
      symptoms,
      load: loadFromSymptoms(symptoms),
      values,
    };
  });

  return {
    rows,
    byDay: new Map(rows.map((r) => [r.day, r])),
    factors,
    factorById: new Map(factors.map((f) => [f.id, f])),
    today,
    firstDay,
  };
}

export function rowsWithSymptoms(table: DailyTable): DailyRow[] {
  return table.rows.filter((r) => !r.future && r.load !== undefined);
}

export function daysLogged(table: DailyTable): number {
  return rowsWithSymptoms(table).length;
}
