import type { SymptomEntry } from "@/core/DataContext";
import { realSymptomEntries } from "./dailyFeatures";
import { toDate } from "./dates";
import { benjaminiHochberg, mean, normalCdf, sd } from "./stats";
import { fmt } from "./text";
import { SYMPTOMS, type SymptomDef } from "./types";

export type DayPart = "morning" | "afternoon" | "evening";

const MIN_PER_PART = 5;

function partOf(date: Date): DayPart {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "evening";
}

export interface RhythmResult {
  symptom: SymptomDef;
  best: DayPart;
  worst: DayPart;
  bestMean: number;
  worstMean: number;
  bestCount: number;
  worstCount: number;
  p: number;
  plain: string;
  numbers: string;
}

export function findRhythms(entries: readonly SymptomEntry[]): RhythmResult[] {
  const real = realSymptomEntries(entries);
  const candidates: Omit<RhythmResult, "plain" | "numbers">[] = [];

  for (const symptom of SYMPTOMS) {
    const byPart: Record<DayPart, number[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const e of real) {
      const v = e[symptom.key];
      if (typeof v === "number") byPart[partOf(toDate(e.timestamp))].push(v);
    }
    const parts = (Object.keys(byPart) as DayPart[]).filter(
      (p) => byPart[p].length >= MIN_PER_PART,
    );
    if (parts.length < 2) continue;
    const score = (p: DayPart) =>
      symptom.higherIsWorse ? -mean(byPart[p]) : mean(byPart[p]);
    const sorted = [...parts].sort((a, b) => score(b) - score(a));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const a = byPart[best];
    const b = byPart[worst];
    const se = Math.sqrt(sd(a) ** 2 / a.length + sd(b) ** 2 / b.length);
    if (se === 0) continue;
    const z = Math.abs(mean(a) - mean(b)) / se;
    candidates.push({
      symptom,
      best,
      worst,
      bestMean: mean(a),
      worstMean: mean(b),
      bestCount: a.length,
      worstCount: b.length,
      p: 2 * (1 - normalCdf(z)),
    });
  }

  const q = benjaminiHochberg(candidates.map((c) => c.p));
  return candidates
    .filter((_, i) => q[i] <= 0.1)
    .map((c) => {
      const better = c.symptom.higherIsWorse ? c.symptom.down : c.symptom.up;
      return {
        ...c,
        plain: `You tend to have ${better} in the ${c.best} than in the ${c.worst}.`,
        numbers: `${c.symptom.label} averaged ${fmt(c.bestMean)} in the ${c.best} (${c.bestCount} check-ins) vs ${fmt(c.worstMean)} in the ${c.worst} (${c.worstCount})`,
      };
    });
}
