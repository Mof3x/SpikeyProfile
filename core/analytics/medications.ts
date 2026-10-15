import type { QuickLogAction, QuickLogEntry } from "@/core/DataContext";
import {
  addDays,
  dayKey,
  daysBetween,
  minutesOfDay,
  toDate,
  weekdayOf,
  type DayKey,
} from "./dates";
import { circularIqr, circularMedian, median } from "./stats";

export interface MedPattern {
  actionId: string;
  name: string;
  logCount: number;
  firstDay: DayKey;
  logDays: Set<DayKey>;
  /** First log time (minutes after midnight) for each logged day. */
  firstLogMinutes: Map<DayKey, number>;
  /** Logged on most days rather than weekly/as needed. */
  daily: boolean;
  usualMinutes?: number;
  windowStart?: number;
  windowEnd?: number;
  loggedToday: boolean;
  lateToday: boolean;
  /** Days in a row (ending yesterday) without a log. */
  notLoggedStreak: number;
  /** Smoothed share of days not logged, per weekday (0 = Sunday). */
  weekdayRates: number[];
  weakWeekday?: { weekday: number; notLogged: number; total: number };
  /** Share of days logged per week, oldest first, last 8 weeks (NaN = no data that week). */
  weeklyRates: number[];
}

const MIN_LOGS_FOR_TIMING = 7;

export function medicationLogs(
  action: QuickLogAction,
  entries: readonly QuickLogEntry[],
): QuickLogEntry[] {
  const name = action.name.trim().toLowerCase();
  return entries.filter(
    (e) =>
      e.actionId === action.id ||
      (e.actionId === "manual" && e.actionName.trim().toLowerCase() === name),
  );
}

export function analyzeMedications(
  actions: readonly QuickLogAction[],
  entries: readonly QuickLogEntry[],
  now: Date,
): MedPattern[] {
  const today = dayKey(now);
  const nowMinutes = minutesOfDay(now);
  const results: MedPattern[] = [];

  for (const action of actions) {
    if (action.category !== "medication") continue;
    const logs = medicationLogs(action, entries)
      .map((e) => toDate(e.timestamp))
      .sort((a, b) => a.getTime() - b.getTime());
    if (logs.length === 0) continue;

    const firstLogMinutes = new Map<DayKey, number>();
    for (const t of logs) {
      const key = dayKey(t);
      if (!firstLogMinutes.has(key)) firstLogMinutes.set(key, minutesOfDay(t));
    }
    const logDays = new Set(firstLogMinutes.keys());
    const sortedDays = [...logDays].sort();
    const firstDay = sortedDays[0];

    const gaps: number[] = [];
    for (let i = 1; i < sortedDays.length; i++)
      gaps.push(daysBetween(sortedDays[i - 1], sortedDays[i]));
    const daily =
      logs.length >= MIN_LOGS_FOR_TIMING &&
      gaps.length > 0 &&
      median(gaps) <= 1.5;

    let usualMinutes: number | undefined;
    let windowStart: number | undefined;
    let windowEnd: number | undefined;
    if (logs.length >= MIN_LOGS_FOR_TIMING) {
      const recent = logs.slice(-30).map(minutesOfDay);
      usualMinutes = circularMedian(recent);
      const half = Math.max(30, circularIqr(recent));
      windowStart = usualMinutes - half;
      windowEnd = usualMinutes + half;
    }

    const loggedToday = logDays.has(today);
    const lateToday =
      daily &&
      windowEnd !== undefined &&
      !loggedToday &&
      nowMinutes > Math.min(windowEnd, 1439);

    let notLoggedStreak = 0;
    let cursor = addDays(today, -1);
    while (cursor >= firstDay && !logDays.has(cursor)) {
      notLoggedStreak++;
      cursor = addDays(cursor, -1);
    }

    const missed = new Array<number>(7).fill(0);
    const totals = new Array<number>(7).fill(0);
    let day = firstDay;
    while (day < today) {
      const wd = weekdayOf(day);
      totals[wd]++;
      if (!logDays.has(day)) missed[wd]++;
      day = addDays(day, 1);
    }
    const weekdayRates = missed.map((m, i) => (m + 1) / (totals[i] + 2));
    const allTotal = totals.reduce((a, b) => a + b, 0);
    const allMissed = missed.reduce((a, b) => a + b, 0);
    const overall = (allMissed + 1) / (allTotal + 2);
    let weakWeekday: MedPattern["weakWeekday"];
    if (daily) {
      let best = -1;
      for (let wd = 0; wd < 7; wd++) {
        if (totals[wd] < 3 || missed[wd] < 2) continue;
        if (weekdayRates[wd] < 0.4 || weekdayRates[wd] - overall < 0.2)
          continue;
        if (best === -1 || weekdayRates[wd] > weekdayRates[best]) best = wd;
      }
      if (best !== -1)
        weakWeekday = {
          weekday: best,
          notLogged: missed[best],
          total: totals[best],
        };
    }

    const weeklyRates: number[] = [];
    for (let w = 7; w >= 0; w--) {
      let logged = 0;
      let total = 0;
      for (let d = 0; d < 7; d++) {
        const key = addDays(today, -(w * 7 + d + 1));
        if (key < firstDay) continue;
        total++;
        if (logDays.has(key)) logged++;
      }
      weeklyRates.push(total === 0 ? NaN : logged / total);
    }

    results.push({
      actionId: action.id,
      name: action.name,
      logCount: logs.length,
      firstDay,
      logDays,
      firstLogMinutes,
      daily,
      usualMinutes,
      windowStart,
      windowEnd,
      loggedToday,
      lateToday,
      notLoggedStreak,
      weekdayRates,
      weakWeekday,
      weeklyRates,
    });
  }
  return results;
}
