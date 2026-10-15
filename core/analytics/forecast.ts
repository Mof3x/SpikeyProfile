import { addDays, type DayKey } from "./dates";
import {
  fitRidge,
  mean,
  modeShare,
  normalCdf,
  predictRidge,
  ridgeContributions,
  sd,
  spearman,
  type RidgeModel,
} from "./stats";
import { factorDriver, fmt, relativeWord } from "./text";
import {
  SCALE_MAX,
  SCALE_MIN,
  SYMPTOMS,
  type DailyRow,
  type DailyTable,
  type FactorDef,
  type SymptomDef,
  type SymptomKey,
} from "./types";

export const MIN_FORECAST_DAYS = 21;
const MIN_FEATURE_DAYS = 14;
const SELECTED_FACTORS = 10;
const LAMBDAS = [0.3, 1, 3, 10, 30, 100];
const EVAL_PAIRS = 84;
const BLOCK = 7;
const BASELINE_WINDOW = 7;

export type ForecastTarget = SymptomKey | "load";

export interface ForecastDriver {
  featureId: string;
  text: string;
  contribution: number;
  /** Pushes the day towards feeling worse. */
  worsens: boolean;
}

export interface TargetForecast {
  target: ForecastTarget;
  symptom?: SymptomDef;
  label: string;
  value: number;
  low: number;
  high: number;
  residualSd: number;
  personalMean: number;
  personalSd: number;
  /** "model" only when it beat both simple baselines on your past days. */
  method: "model" | "recent average" | "usual average";
  modelMae?: number;
  baselineMae?: number;
  trainingDays: number;
  drivers: ForecastDriver[];
  word: string;
  plain: string;
  numbers: string;
}

export interface DayForecast {
  day: DayKey;
  symptoms: TargetForecast[];
  load?: TargetForecast;
  ready: boolean;
  trainingDays: number;
}

interface FeatureSpec {
  id: string;
  label: string;
  factor?: FactorDef;
  lagSymptom?: SymptomDef;
  read: (
    row: DailyRow | undefined,
    prev: DailyRow | undefined,
  ) => number | undefined;
}

function targetValue(
  row: DailyRow | undefined,
  target: ForecastTarget,
): number | undefined {
  if (!row || row.future) return undefined;
  return target === "load" ? row.load : row.symptoms[target];
}

function buildFeatureSpecs(table: DailyTable): FeatureSpec[] {
  const specs: FeatureSpec[] = SYMPTOMS.map((s) => ({
    id: `lag.${s.key}`,
    label: `${s.label} yesterday`,
    lagSymptom: s,
    read: (_row, prev) => prev?.symptoms[s.key],
  }));
  for (const factor of table.factors) {
    const sameDay = factor.knownInAdvance || factor.group === "sleep";
    specs.push({
      id: `${factor.id}@${sameDay ? 0 : 1}`,
      label: factor.label,
      factor,
      read: sameDay
        ? (row) => row?.values[factor.id]
        : (_row, prev) =>
            prev && !prev.future ? prev.values[factor.id] : undefined,
    });
  }
  return specs;
}

interface Pair {
  day: DayKey;
  y: number;
  raw: (number | undefined)[];
}

function selectFeatures(specs: FeatureSpec[], pairs: Pair[]): number[] {
  const lagIdx: number[] = [];
  const scored: { idx: number; score: number }[] = [];
  specs.forEach((spec, idx) => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of pairs) {
      const v = p.raw[idx];
      if (v === undefined) continue;
      xs.push(v);
      ys.push(p.y);
    }
    if (xs.length < MIN_FEATURE_DAYS || modeShare(xs) > 0.9) return;
    if (spec.lagSymptom) {
      lagIdx.push(idx);
      return;
    }
    const r = spearman(xs, ys);
    if (Number.isFinite(r)) scored.push({ idx, score: Math.abs(r) });
  });
  scored.sort((a, b) => b.score - a.score);
  return [...lagIdx, ...scored.slice(0, SELECTED_FACTORS).map((s) => s.idx)];
}

function featureMeans(pairs: Pair[], selected: number[]): number[] {
  return selected.map((idx) => {
    const vals = pairs
      .map((p) => p.raw[idx])
      .filter((v): v is number => v !== undefined);
    return vals.length ? mean(vals) : 0;
  });
}

function toMatrixRow(
  raw: (number | undefined)[],
  selected: number[],
  means: number[],
): number[] {
  return selected.map((idx, j) => raw[idx] ?? means[j]);
}

function fit(pairs: Pair[], selected: number[], lambda: number) {
  const means = featureMeans(pairs, selected);
  const X = pairs.map((p) => toMatrixRow(p.raw, selected, means));
  const model = fitRidge(
    X,
    pairs.map((p) => p.y),
    lambda,
  );
  return { model, means };
}

const clampScale = (v: number) => Math.max(SCALE_MIN, Math.min(SCALE_MAX, v));

function driversFor(
  model: RidgeModel,
  x: number[],
  selected: number[],
  specs: FeatureSpec[],
  higherIsWorse: boolean,
): ForecastDriver[] {
  const contributions = ridgeContributions(model, x);
  const out: ForecastDriver[] = [];
  contributions.forEach((c, j) => {
    const spec = specs[selected[j]];
    const z = (x[j] - model.standardizer.means[j]) / model.standardizer.sds[j];
    if (Math.abs(c) < 0.12 || Math.abs(z) < 0.5) return;
    let text: string;
    if (spec.lagSymptom) {
      text = `${z > 0 ? "higher" : "lower"} ${spec.lagSymptom.label.toLowerCase()} yesterday`;
    } else if (spec.factor) {
      if (spec.factor.kind === "yesno" && x[j] <= 0) return;
      text = factorDriver(spec.factor, z > 0);
    } else return;
    out.push({
      featureId: spec.id,
      text,
      contribution: c,
      worsens: c > 0 === higherIsWorse,
    });
  });
  return out
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);
}

function forecastTarget(
  table: DailyTable,
  specs: FeatureSpec[],
  target: ForecastTarget,
  day: DayKey,
): TargetForecast | undefined {
  const symptom =
    target === "load" ? undefined : SYMPTOMS.find((s) => s.key === target);
  const label = symptom?.label ?? "Overall load";
  const higherIsWorse = symptom ? symptom.higherIsWorse : true;

  const pairs: Pair[] = [];
  for (const row of table.rows) {
    if (row.future || row.day >= day) continue;
    const y = targetValue(row, target);
    if (y === undefined) continue;
    const prev = table.byDay.get(addDays(row.day, -1));
    pairs.push({ day: row.day, y, raw: specs.map((s) => s.read(row, prev)) });
  }
  const recent = pairs.slice(-365);
  const history = recent.map((p) => p.y);
  if (history.length < 3) return undefined;
  const personalMean = mean(history);
  const personalSd = Math.max(sd(history), 0.5);
  const lastWeek = history.slice(-BASELINE_WINDOW);
  const baselineValue = mean(lastWeek);

  const targetRow = table.byDay.get(day);
  const targetPrev = table.byDay.get(addDays(day, -1));
  const targetRaw = specs.map((s) => s.read(targetRow, targetPrev));

  let method: TargetForecast["method"] = "recent average";
  let value = baselineValue;
  let residualSd = personalSd;
  let modelMae: number | undefined;
  let baselineMae: number | undefined;
  let drivers: ForecastDriver[] = [];

  if (recent.length >= MIN_FORECAST_DAYS) {
    const evalStart = Math.max(14, recent.length - EVAL_PAIRS);
    const errors = new Map<number, number[]>(LAMBDAS.map((l) => [l, []]));
    const recentErrors: number[] = [];
    const usualErrors: number[] = [];
    for (let b = evalStart; b < recent.length; b += BLOCK) {
      const train = recent.slice(0, b);
      const test = recent.slice(b, b + BLOCK);
      const selected = selectFeatures(specs, train);
      if (selected.length === 0) continue;
      for (const lambda of LAMBDAS) {
        const { model, means } = fit(train, selected, lambda);
        for (const p of test) {
          const pred = clampScale(
            predictRidge(model, toMatrixRow(p.raw, selected, means)),
          );
          errors.get(lambda)!.push(Math.abs(pred - p.y));
        }
      }
      const usual = mean(train.map((q) => q.y));
      test.forEach((p, i) => {
        const before = recent
          .slice(Math.max(0, b + i - BASELINE_WINDOW), b + i)
          .map((q) => q.y);
        recentErrors.push(Math.abs(mean(before) - p.y));
        usualErrors.push(Math.abs(usual - p.y));
      });
    }
    if (recentErrors.length > 0) {
      const recentMae = mean(recentErrors);
      const usualMae = mean(usualErrors);
      const usualWins = usualMae < recentMae;
      const baselineErrors = usualWins ? usualErrors : recentErrors;
      let bestLambda = LAMBDAS[0];
      let bestMae = Infinity;
      for (const lambda of LAMBDAS) {
        const e = errors.get(lambda)!;
        if (e.length === 0) continue;
        const mae = mean(e);
        if (mae < bestMae) {
          bestMae = mae;
          bestLambda = lambda;
        }
      }
      baselineMae = Math.min(recentMae, usualMae);
      modelMae = bestMae;
      // The model has to win clearly and consistently, not just by luck of picking the best setting.
      const bestErrors = errors.get(bestLambda)!;
      const diffs = bestErrors.map((e, i) => e - baselineErrors[i]);
      const diffSd = sd(diffs);
      const oneSidedP =
        diffs.length >= 10 && diffSd > 0
          ? normalCdf(mean(diffs) / (diffSd / Math.sqrt(diffs.length)))
          : 1;
      if (
        Number.isFinite(bestMae) &&
        bestMae < baselineMae * 0.97 &&
        oneSidedP < 0.05
      ) {
        const selected = selectFeatures(specs, recent);
        const { model, means } = fit(recent, selected, bestLambda);
        const x = toMatrixRow(targetRaw, selected, means);
        value = clampScale(predictRidge(model, x));
        method = "model";
        const errs = errors.get(bestLambda)!;
        residualSd = Math.max(0.4, Math.sqrt(mean(errs.map((e) => e * e))));
        drivers = driversFor(model, x, selected, specs, higherIsWorse);
      } else {
        residualSd = Math.max(
          0.4,
          Math.sqrt(mean(baselineErrors.map((e) => e * e))),
        );
        if (usualWins) {
          method = "usual average";
          value = personalMean;
        }
      }
    }
  }

  const z = (value - personalMean) / personalSd;
  const word = relativeWord(z);
  const low = clampScale(value - residualSd);
  const high = clampScale(value + residualSd);
  return {
    target,
    symptom,
    label,
    value,
    low,
    high,
    residualSd,
    personalMean,
    personalSd,
    method,
    modelMae,
    baselineMae,
    trainingDays: recent.length,
    drivers,
    word,
    plain: `${label}: ${word}`,
    numbers: `${label} ≈ ${fmt(value, 0)}/10 (likely ${fmt(low, 0)}–${fmt(high, 0)})`,
  };
}

export function forecastDay(table: DailyTable, day: DayKey): DayForecast {
  if (table.rows.length === 0)
    return { day, symptoms: [], ready: false, trainingDays: 0 };
  const specs = buildFeatureSpecs(table);
  const symptoms = SYMPTOMS.map((s) =>
    forecastTarget(table, specs, s.key, day),
  ).filter((f): f is TargetForecast => f !== undefined);
  const load = forecastTarget(table, specs, "load", day);
  const trainingDays = load?.trainingDays ?? 0;
  return {
    day,
    symptoms,
    load,
    ready: trainingDays >= MIN_FORECAST_DAYS,
    trainingDays,
  };
}
