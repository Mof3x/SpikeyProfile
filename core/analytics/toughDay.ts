import type { DayNote } from "@/core/DataContext";
import type { DayKey } from "./dates";
import type { DayForecast, ForecastDriver } from "./forecast";
import { normalCdf, quantile } from "./stats";
import { fmt } from "./text";
import type { DailyTable } from "./types";

export const TOUGH_DAY_PROBABILITY = 0.6;

export interface ToughDayOutlook {
  day: DayKey;
  probability: number;
  threshold: number;
  predictedLoad: number;
  warn: boolean;
  drivers: ForecastDriver[];
  plain: string;
  numbers: string;
}

/** Day notes use 1 (very rough) to 5 (very good); map them onto the 1–10 load scale. */
export function loadFromNote(overall: number): number {
  return 11 - overall * 2;
}

/** Loads for every past day: check-ins first, then "how were those days" notes for gaps. */
export function historicalLoads(
  table: DailyTable,
  notes: readonly DayNote[],
): number[] {
  const loads: number[] = [];
  const noteByDay = new Map(
    notes
      .filter((n) => n.overall !== undefined)
      .map((n) => [n.date, n.overall!]),
  );
  for (const row of table.rows) {
    if (row.future) continue;
    if (row.load !== undefined) loads.push(row.load);
    else if (noteByDay.has(row.day))
      loads.push(loadFromNote(noteByDay.get(row.day)!));
  }
  return loads;
}

export function toughDayThreshold(
  table: DailyTable,
  notes: readonly DayNote[],
): number | undefined {
  const loads = historicalLoads(table, notes);
  if (loads.length < 21) return undefined;
  return quantile(loads, 0.75);
}

export function toughDayOutlook(
  table: DailyTable,
  forecast: DayForecast,
  notes: readonly DayNote[],
  label: "Today" | "Tomorrow",
): ToughDayOutlook | undefined {
  const load = forecast.load;
  if (!load || load.method !== "model") return undefined;
  const threshold = toughDayThreshold(table, notes);
  if (threshold === undefined) return undefined;
  const probability = 1 - normalCdf((threshold - load.value) / load.residualSd);
  const warn = probability >= TOUGH_DAY_PROBABILITY;
  const reasons = load.drivers.filter((d) => d.worsens).map((d) => d.text);
  const why = reasons.length ? ` Why: ${reasons.join(", ")}.` : "";
  return {
    day: forecast.day,
    probability,
    threshold,
    predictedLoad: load.value,
    warn,
    drivers: load.drivers,
    plain: warn
      ? `${label} might be a heavier day. Want to keep plans light?${why}`
      : `${label} doesn't look like a heavier-than-usual day.`,
    numbers: `Chance of a heavier-than-usual day: ${Math.round(probability * 100)}% (predicted load ${fmt(load.value)} vs your heavier-day line of ${fmt(threshold)})`,
  };
}
