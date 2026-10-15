import type { AgeRange, PeriodDay } from "@/core/DataContext";
import { addDays, daysBetween, type DayKey } from "./dates";
import { median, quantile } from "./stats";
import type { ExternalSourceData } from "./types";

export interface CycleDayState {
  onPeriod: boolean;
  daysSinceStart?: number;
  daysUntilNext?: number;
  premenstrual?: boolean;
  midCycle?: boolean;
  /** True when based on a predicted (not yet logged) start. */
  estimated: boolean;
}

export interface CycleInfo {
  hasData: boolean;
  periodDays: Set<DayKey>;
  firstPeriodDay?: DayKey;
  starts: DayKey[];
  cycleLengths: number[];
  medianLength: number;
  periodLength: number;
  spread: number;
  irregular: boolean;
  predictedNextStart?: DayKey;
  predictedRange?: [DayKey, DayKey];
  daysUntilNext?: number;
  currentCycleDay?: number;
  stateFor: (day: DayKey) => CycleDayState | undefined;
}

const DEFAULT_CYCLE = 28;
const OLDER_RANGES: AgeRange[] = ["45-54", "55+"];

export function collectPeriodDays(
  periodDays: readonly PeriodDay[],
  external: readonly ExternalSourceData[],
): Set<DayKey> {
  const days = new Set(periodDays.map((p) => p.date));
  for (const source of external) {
    for (const [day, values] of Object.entries(source.days)) {
      if ((values["menstruationFlow"] ?? 0) > 0) days.add(day);
    }
  }
  return days;
}

export function analyzeCycle(
  periodDaySet: Set<DayKey>,
  today: DayKey,
  ageRange: AgeRange | null,
): CycleInfo {
  const sorted = [...periodDaySet].sort();
  const empty: CycleInfo = {
    hasData: false,
    periodDays: periodDaySet,
    starts: [],
    cycleLengths: [],
    medianLength: DEFAULT_CYCLE,
    periodLength: 5,
    spread: 0,
    irregular: false,
    stateFor: () => undefined,
  };
  if (sorted.length === 0) return empty;

  const starts: DayKey[] = [];
  for (const day of sorted) {
    if (
      !periodDaySet.has(addDays(day, -1)) &&
      !periodDaySet.has(addDays(day, -2))
    )
      starts.push(day);
  }

  const periodLengths: number[] = [];
  for (const start of starts) {
    let len = 0;
    let cursor = start;
    while (periodDaySet.has(cursor) || periodDaySet.has(addDays(cursor, 1))) {
      if (periodDaySet.has(cursor)) len = daysBetween(start, cursor) + 1;
      cursor = addDays(cursor, 1);
      if (len > 14) break;
    }
    periodLengths.push(Math.max(1, len));
  }

  const cycleLengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetween(starts[i - 1], starts[i]);
    if (len >= 15 && len <= 60) cycleLengths.push(len);
  }

  const medianLength =
    cycleLengths.length >= 1 ? Math.round(median(cycleLengths)) : DEFAULT_CYCLE;
  const spread =
    cycleLengths.length >= 3
      ? quantile(cycleLengths, 0.75) - quantile(cycleLengths, 0.25)
      : 0;
  const irregular =
    spread > 7 || (ageRange !== null && OLDER_RANGES.includes(ageRange));
  const periodLength = Math.max(2, Math.round(median(periodLengths)));

  const lastStart = starts[starts.length - 1];
  let predictedNextStart: DayKey | undefined;
  let predictedRange: [DayKey, DayKey] | undefined;
  if (lastStart && cycleLengths.length >= 1) {
    let next = addDays(lastStart, medianLength);
    let guard = 0;
    while (next < addDays(today, -3) && guard < 6) {
      next = addDays(next, medianLength);
      guard++;
    }
    if (guard < 6) {
      predictedNextStart = next;
      const halfWidth = irregular
        ? Math.max(4, Math.round(spread))
        : Math.max(2, Math.round(spread / 2));
      predictedRange = [addDays(next, -halfWidth), addDays(next, halfWidth)];
    }
  }

  const stateFor = (day: DayKey): CycleDayState | undefined => {
    if (day < sorted[0]) return undefined;
    const future = day > today;
    let nextStart: DayKey | undefined = starts.find((s) => s > day);
    let estimated = false;
    if (!nextStart && predictedNextStart && predictedNextStart > day) {
      nextStart = predictedNextStart;
      estimated = true;
    }
    let prevStart: DayKey | undefined;
    for (const s of starts) if (s <= day) prevStart = s;

    let onPeriod = periodDaySet.has(day);
    if (future && !onPeriod && predictedNextStart && !irregular) {
      const offset = daysBetween(predictedNextStart, day);
      if (offset >= 0 && offset < periodLength) {
        onPeriod = true;
        estimated = true;
      }
    }

    const daysUntilNext = nextStart ? daysBetween(day, nextStart) : undefined;
    const usableUntil =
      daysUntilNext !== undefined &&
      !(estimated && irregular) &&
      daysUntilNext <= 60;
    return {
      onPeriod,
      daysSinceStart: prevStart ? daysBetween(prevStart, day) : undefined,
      daysUntilNext: usableUntil ? daysUntilNext : undefined,
      premenstrual: usableUntil
        ? daysUntilNext! >= 1 && daysUntilNext! <= 7
        : undefined,
      midCycle: usableUntil
        ? daysUntilNext! >= 12 && daysUntilNext! <= 16
        : undefined,
      estimated,
    };
  };

  return {
    hasData: true,
    periodDays: periodDaySet,
    firstPeriodDay: sorted[0],
    starts,
    cycleLengths,
    medianLength,
    periodLength,
    spread,
    irregular,
    predictedNextStart,
    predictedRange,
    daysUntilNext: predictedNextStart
      ? daysBetween(today, predictedNextStart)
      : undefined,
    currentCycleDay:
      lastStart && lastStart <= today
        ? daysBetween(lastStart, today) + 1
        : undefined,
    stateFor,
  };
}
