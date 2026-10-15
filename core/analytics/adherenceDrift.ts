import { addDays, type DayKey } from "./dates";
import { numberWord } from "./engagement";
import type { MedPattern } from "./medications";
import { mean, median } from "./stats";
import { fmt } from "./text";
import type { DailyTable } from "./types";

const STEADY = 0.8;
const SLIPPED = 0.6;
const WINDOW = 14;

export interface DriftEpisode {
  dropDay: DayKey;
  steadyWeeks: number;
  goodStretchBefore: boolean;
  harderAfter: boolean;
}

export interface MedDrift {
  actionId: string;
  name: string;
  episodes: DriftEpisode[];
  pattern: boolean;
  typicalSteadyWeeks?: number;
  currentSteadyWeeks: number;
  recentRate: number;
  previousRate: number;
  inGoodStretch: boolean;
  patternInsight?: { plain: string; numbers: string };
  headsUp?: { plain: string; numbers: string };
}

function goodStretch(
  table: DailyTable,
  from: DayKey,
  to: DayKey,
  medianLoad: number,
): boolean | undefined {
  const loads: number[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const l = table.byDay.get(d)?.load;
    if (l !== undefined) loads.push(l);
  }
  if (loads.length < 7) return undefined;
  return loads.filter((l) => l < medianLoad).length / loads.length >= 0.6;
}

function meanLoad(
  table: DailyTable,
  from: DayKey,
  to: DayKey,
): number | undefined {
  const loads: number[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const l = table.byDay.get(d)?.load;
    if (l !== undefined) loads.push(l);
  }
  return loads.length >= 5 ? mean(loads) : undefined;
}

export function analyzeAdherenceDrift(
  table: DailyTable,
  meds: MedPattern[],
): MedDrift[] {
  const loads = table.rows
    .filter((r) => !r.future && r.load !== undefined)
    .map((r) => r.load!);
  if (loads.length === 0) return [];
  const medianLoad = median(loads);
  const yesterday = addDays(table.today, -1);
  const out: MedDrift[] = [];

  for (const med of meds) {
    if (!med.daily) continue;
    const days: DayKey[] = [];
    for (let d = med.firstDay; d <= yesterday; d = addDays(d, 1)) days.push(d);
    if (days.length < WINDOW * 2) continue;

    const rate: number[] = days.map((_, i) => {
      if (i < WINDOW - 1) return NaN;
      let logged = 0;
      for (let k = i - WINDOW + 1; k <= i; k++)
        if (med.logDays.has(days[k])) logged++;
      return logged / WINDOW;
    });

    const steadyRunEndingAt = (i: number) => {
      let n = 0;
      for (let k = i; k >= 0 && rate[k] >= STEADY; k--) n++;
      return n;
    };

    const episodes: DriftEpisode[] = [];
    let lastEvent = -Infinity;
    for (let i = WINDOW; i < days.length; i++) {
      if (!(rate[i] <= SLIPPED && rate[i - 1] > SLIPPED)) continue;
      if (i - lastEvent < WINDOW) continue;
      let peak = -1;
      for (let k = Math.max(0, i - 28); k < i; k++)
        if (rate[k] >= STEADY) peak = k;
      if (peak < 0) continue;
      lastEvent = i;
      const steadyDays = steadyRunEndingAt(peak) + WINDOW - 1;
      const dropDay = days[i];
      const before = goodStretch(
        table,
        addDays(dropDay, -42),
        addDays(dropDay, -14),
        medianLoad,
      );
      const loadBefore = meanLoad(
        table,
        addDays(dropDay, -14),
        addDays(dropDay, -1),
      );
      const loadAfter = meanLoad(table, dropDay, addDays(dropDay, 13));
      episodes.push({
        dropDay,
        steadyWeeks: steadyDays / 7,
        goodStretchBefore: before === true,
        harderAfter:
          loadBefore !== undefined &&
          loadAfter !== undefined &&
          loadAfter - loadBefore >= 0.5,
      });
    }

    const feelGoodEpisodes = episodes.filter((e) => e.goodStretchBefore);
    const pattern = feelGoodEpisodes.length >= 2;
    const typicalSteadyWeeks = pattern
      ? median(feelGoodEpisodes.map((e) => e.steadyWeeks))
      : undefined;

    const last = days.length - 1;
    const currentSteadyWeeks =
      (steadyRunEndingAt(Math.max(0, last - 7)) + WINDOW - 1) / 7;
    const countLogged = (from: number, to: number) => {
      let n = 0;
      let total = 0;
      for (let k = Math.max(0, from); k <= to; k++) {
        total++;
        if (med.logDays.has(days[k])) n++;
      }
      return total ? n / total : NaN;
    };
    const recentRate = countLogged(last - 6, last);
    const previousRate = countLogged(last - 20, last - 7);
    const inGoodStretch =
      goodStretch(table, addDays(yesterday, -13), yesterday, medianLoad) ===
      true;

    let patternInsight: MedDrift["patternInsight"];
    if (pattern && typicalSteadyWeeks !== undefined) {
      const weeks = Math.round(typicalSteadyWeeks);
      patternInsight = {
        plain: `${numberWord(feelGoodEpisodes.length)[0].toUpperCase()}${numberWord(feelGoodEpisodes.length).slice(1)} times before, after about ${numberWord(weeks)} weeks of steady ${med.name} and feeling better, logging it slipped.`,
        numbers: `${feelGoodEpisodes.length} drop-offs in ${med.name} logging (to ≤60% of days) followed good stretches, after a median of ${fmt(typicalSteadyWeeks)} steady weeks`,
      };
    }

    let headsUp: MedDrift["headsUp"];
    const dipping = previousRate >= STEADY && recentRate <= previousRate - 0.15;
    const dueByPattern =
      pattern &&
      typicalSteadyWeeks !== undefined &&
      currentSteadyWeeks >= typicalSteadyWeeks * 0.8;
    if (
      inGoodStretch &&
      (dipping || (dueByPattern && recentRate < previousRate))
    ) {
      const harderBefore = episodes.some((e) => e.harderAfter);
      const history = harderBefore
        ? " Last time, that came before a harder patch."
        : pattern
          ? " Last time, logging slipped after a stretch like this."
          : "";
      headsUp = {
        plain: `You've been feeling steadier lately, and ${med.name} has been logged less this week.${history} If you're thinking about changing your meds, your prescriber can help.`,
        numbers: `${med.name}: logged on ${Math.round(recentRate * 7)} of the last 7 days vs ${Math.round(previousRate * 100)}% of days the fortnight before`,
      };
    }

    out.push({
      actionId: med.actionId,
      name: med.name,
      episodes,
      pattern,
      typicalSteadyWeeks,
      currentSteadyWeeks,
      recentRate,
      previousRate,
      inGoodStretch,
      patternInsight,
      headsUp,
    });
  }
  return out;
}
