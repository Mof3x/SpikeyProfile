import { addDays } from "./dates";
import {
  benjaminiHochberg,
  correlationPValue,
  mean,
  modeShare,
  quantile,
  spearman,
} from "./stats";
import { factorWhen, fmt, strengthLabel } from "./text";
import {
  SYMPTOMS,
  type DailyRow,
  type DailyTable,
  type FactorDef,
  type SymptomDef,
  type SymptomKey,
} from "./types";

export const MIN_PAIRED_DAYS = 14;
const MIN_GROUP_DAYS = 5;
const MAX_MODE_SHARE = 0.9;
const FDR_Q = 0.1;
const DUPLICATE_FACTOR_RHO = 0.8;

export type OutcomeDef = Omit<SymptomDef, "key"> & {
  key: SymptomKey | "sleep";
};

/** Sleep the following night, tested against everything that isn't itself about sleep. */
export const SLEEP_OUTCOME: OutcomeDef = {
  key: "sleep",
  label: "Sleep",
  higherIsWorse: false,
  up: "longer sleep",
  down: "shorter sleep",
};

export interface CorrelationResult {
  id: string;
  factor: FactorDef;
  symptom: OutcomeDef;
  lag: 0 | 1;
  rho: number;
  n: number;
  p: number;
  q: number;
  significant: boolean;
  /** The "more"/"yes" side of the factor goes with the symptom going up. */
  symptomUp: boolean;
  /** The "more"/"yes" side goes with feeling better. */
  good: boolean;
  yesMean?: number;
  noMean?: number;
  highMean?: number;
  lowMean?: number;
  confidence: "early signal" | "consistent";
  plain: string;
  numbers: string;
}

export interface CorrelationSummary {
  /** Significant, de-duplicated, strongest first. */
  results: CorrelationResult[];
  testedCount: number;
}

function describe(r: Omit<CorrelationResult, "plain" | "numbers">): {
  plain: string;
  numbers: string;
} {
  const side = r.factor.kind === "yesno" ? "yes" : "more";
  const isSleep = r.symptom.key === "sleep";
  const when = isSleep
    ? factorWhen(r.factor, side, true).replace(
        /^the day after/,
        "the night after",
      )
    : factorWhen(r.factor, side, r.lag === 1);
  const plain = isSleep
    ? `You tend to sleep ${r.symptomUp ? "longer" : "less"} ${when}.`
    : `You tend to have ${r.symptomUp ? r.symptom.up : r.symptom.down} ${when}.`;
  const label = r.symptom.label;
  const strength = `${strengthLabel(r.rho)} link`;
  const nextDay = isSleep
    ? " (the following night)"
    : r.lag === 1
      ? " (next day)"
      : "";
  let numbers: string;
  if (r.factor.kind === "yesno") {
    numbers = `${label} averaged ${fmt(r.yesMean!)} with "${r.factor.label}" vs ${fmt(r.noMean!)} without${nextDay} · ${r.n} days · ${strength}`;
  } else {
    numbers = `${label} averaged ${fmt(r.highMean!)} when ${r.factor.label.toLowerCase()} was in your top third vs ${fmt(r.lowMean!)} in your bottom third${nextDay} · ${r.n} days · ${strength} (ρ ${fmt(r.rho, 2)})`;
  }
  return { plain, numbers };
}

type Tested = Omit<
  CorrelationResult,
  "plain" | "numbers" | "q" | "significant"
>;

function testPair(
  factor: FactorDef,
  outcome: OutcomeDef,
  lag: 0 | 1,
  table: DailyTable,
  read: (row: DailyRow) => number | undefined,
): Tested | undefined {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const row of table.rows) {
    if (row.future) continue;
    const x = row.values[factor.id];
    if (x === undefined) continue;
    const target = lag === 0 ? row : table.byDay.get(addDays(row.day, 1));
    if (!target || target.future) continue;
    const y = read(target);
    if (y === undefined) continue;
    xs.push(x);
    ys.push(y);
  }
  if (xs.length < MIN_PAIRED_DAYS) return undefined;
  if (modeShare(xs) > MAX_MODE_SHARE) return undefined;

  let yesMean: number | undefined;
  let noMean: number | undefined;
  let highMean: number | undefined;
  let lowMean: number | undefined;
  if (factor.kind === "yesno") {
    const yes = ys.filter((_, i) => xs[i] > 0);
    const no = ys.filter((_, i) => xs[i] <= 0);
    if (yes.length < MIN_GROUP_DAYS || no.length < MIN_GROUP_DAYS)
      return undefined;
    yesMean = mean(yes);
    noMean = mean(no);
  } else {
    const lo = quantile(xs, 1 / 3);
    const hi = quantile(xs, 2 / 3);
    const low = ys.filter((_, i) => xs[i] <= lo);
    const high = ys.filter((_, i) => xs[i] >= hi);
    if (low.length < MIN_GROUP_DAYS || high.length < MIN_GROUP_DAYS)
      return undefined;
    lowMean = mean(low);
    highMean = mean(high);
  }

  const rho = spearman(xs, ys);
  if (!Number.isFinite(rho)) return undefined;
  const symptomUp = factor.kind === "yesno" ? yesMean! > noMean! : rho > 0;
  return {
    id: `${factor.id}|${outcome.key}|${lag}`,
    factor,
    symptom: outcome,
    lag,
    rho,
    n: xs.length,
    p: correlationPValue(rho, xs.length),
    symptomUp,
    good: symptomUp !== outcome.higherIsWorse,
    yesMean,
    noMean,
    highMean,
    lowMean,
    confidence: xs.length >= 30 ? "consistent" : "early signal",
  };
}

export function findCorrelations(table: DailyTable): CorrelationSummary {
  const tested: Tested[] = [];

  for (const factor of table.factors) {
    for (const lag of [0, 1] as const) {
      if (lag === 1 && !factor.testNextDay) continue;
      for (const symptom of SYMPTOMS) {
        const t = testPair(
          factor,
          symptom,
          lag,
          table,
          (row) => row.symptoms[symptom.key],
        );
        if (t) tested.push(t);
      }
    }
    if (
      factor.group !== "sleep" &&
      factor.group !== "weather" &&
      factor.group !== "cycle" &&
      factor.testNextDay
    ) {
      const t = testPair(
        factor,
        SLEEP_OUTCOME,
        1,
        table,
        (row) => row.values["sleep.hours"],
      );
      if (t) tested.push(t);
    }
  }

  const qValues = benjaminiHochberg(tested.map((t) => t.p));
  const all: CorrelationResult[] = tested.map((t, i) => {
    const withQ = { ...t, q: qValues[i], significant: qValues[i] <= FDR_Q };
    return { ...withQ, ...describe(withQ) };
  });

  const significant = all
    .filter((r) => r.significant)
    .sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho));

  const kept: CorrelationResult[] = [];
  const factorPairCache = new Map<string, number>();
  const factorsMoveTogether = (a: string, b: string) => {
    if (a === b) return true;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    let r = factorPairCache.get(key);
    if (r === undefined) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const row of table.rows) {
        const x = row.values[a];
        const y = row.values[b];
        if (x === undefined || y === undefined) continue;
        xs.push(x);
        ys.push(y);
      }
      r = xs.length >= MIN_PAIRED_DAYS ? Math.abs(spearman(xs, ys)) : 0;
      if (!Number.isFinite(r)) r = 0;
      factorPairCache.set(key, r);
    }
    return r > DUPLICATE_FACTOR_RHO;
  };

  const familyOf = (f: FactorDef) => f.family ?? f.id;
  for (const candidate of significant) {
    const duplicate = kept.some(
      (k) =>
        k.symptom.key === candidate.symptom.key &&
        (familyOf(k.factor) === familyOf(candidate.factor) ||
          factorsMoveTogether(k.factor.id, candidate.factor.id)),
    );
    if (!duplicate) kept.push(candidate);
  }

  return { results: kept, testedCount: tested.length };
}

/** Factors that have enough data to be analysed, for "what's being tracked" summaries. */
export function analysableFactorCount(table: DailyTable): number {
  let count = 0;
  for (const factor of table.factors) {
    const values: number[] = [];
    for (const row of table.rows) {
      const v = row.values[factor.id];
      if (!row.future && v !== undefined) values.push(v);
    }
    if (values.length >= MIN_PAIRED_DAYS && modeShare(values) <= MAX_MODE_SHARE)
      count++;
  }
  return count;
}
