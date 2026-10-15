import { dayKey, type DayKey } from "@/core/analytics/dates";
import { bedtimeHours } from "../healthMetrics";

export type DailyValues = Record<DayKey, Record<string, number>>;

/** Collects many readings per day and reduces them to one value per metric. */
export class DailyAccumulator {
  private sums = new Map<string, number>();
  private counts = new Map<string, number>();
  private maxes = new Map<string, number>();
  private mins = new Map<string, number>();
  private modes = new Map<string, "sum" | "mean" | "max" | "min">();

  private key(day: DayKey, metric: string) {
    return `${day}|${metric}`;
  }

  add(
    day: DayKey,
    metric: string,
    value: number,
    mode: "sum" | "mean" | "max" | "min",
  ) {
    if (!Number.isFinite(value)) return;
    const k = this.key(day, metric);
    this.modes.set(k, mode);
    this.sums.set(k, (this.sums.get(k) ?? 0) + value);
    this.counts.set(k, (this.counts.get(k) ?? 0) + 1);
    this.maxes.set(k, Math.max(this.maxes.get(k) ?? -Infinity, value));
    this.mins.set(k, Math.min(this.mins.get(k) ?? Infinity, value));
  }

  result(): DailyValues {
    const out: DailyValues = {};
    for (const [k, mode] of this.modes) {
      const [day, metric] = k.split("|");
      const value =
        mode === "sum"
          ? this.sums.get(k)!
          : mode === "mean"
            ? this.sums.get(k)! / this.counts.get(k)!
            : mode === "max"
              ? this.maxes.get(k)!
              : this.mins.get(k)!;
      (out[day] ??= {})[metric] = Math.round(value * 100) / 100;
    }
    return out;
  }
}

export interface SleepSegment {
  start: Date;
  end: Date;
  /** "asleep" for unspecified sleep, or a specific stage. */
  stage: "inBed" | "awake" | "asleep" | "light" | "deep" | "rem";
}

/**
 * Turns sleep segments into per-night values, filed under the day you woke up
 * (the same day a manual "last night's sleep" entry would be logged).
 */
export function addSleep(
  acc: DailyAccumulator,
  segments: readonly SleepSegment[],
) {
  const byWakeDay = new Map<DayKey, SleepSegment[]>();
  for (const s of segments) {
    const day = dayKey(s.end);
    byWakeDay.set(day, [...(byWakeDay.get(day) ?? []), s]);
  }
  for (const [day, segs] of byWakeDay) {
    const minutes = (s: SleepSegment) =>
      (s.end.getTime() - s.start.getTime()) / 60000;
    const asleep = segs.filter(
      (s) => s.stage !== "inBed" && s.stage !== "awake",
    );
    const asleepMin = asleep.reduce((a, s) => a + minutes(s), 0);
    const start = Math.min(...segs.map((s) => s.start.getTime()));
    const end = Math.max(...segs.map((s) => s.end.getTime()));
    if (asleepMin > 0) acc.add(day, "sleepHours", asleepMin / 60, "sum");
    acc.add(day, "timeInBed", (end - start) / 3600000, "max");
    const firstAsleep = asleep.length
      ? Math.min(...asleep.map((s) => s.start.getTime()))
      : start;
    acc.add(day, "bedtime", bedtimeHours(new Date(firstAsleep)), "min");
    const wake = new Date(end);
    acc.add(day, "wakeTime", wake.getHours() + wake.getMinutes() / 60, "max");
    const staged = asleep.filter(
      (s) => s.stage === "deep" || s.stage === "rem" || s.stage === "light",
    );
    if (staged.length && asleepMin > 0) {
      const deep = asleep
        .filter((s) => s.stage === "deep")
        .reduce((a, s) => a + minutes(s), 0);
      const rem = asleep
        .filter((s) => s.stage === "rem")
        .reduce((a, s) => a + minutes(s), 0);
      acc.add(day, "deepShare", (deep / asleepMin) * 100, "max");
      acc.add(day, "remShare", (rem / asleepMin) * 100, "max");
    }
  }
}

/** Merge day maps; earlier sources win where both have a value. */
export function mergeDailyValues(...sources: DailyValues[]): DailyValues {
  const out: DailyValues = {};
  for (const source of sources) {
    for (const [day, values] of Object.entries(source)) {
      const target = (out[day] ??= {});
      for (const [k, v] of Object.entries(values))
        if (target[k] === undefined) target[k] = v;
    }
  }
  return out;
}
