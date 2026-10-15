import { sampleRankCorrelation, sampleCorrelation } from "simple-statistics";

export function mean(values: readonly number[]): number {
  if (values.length === 0) return NaN;
  let total = 0;
  for (const v of values) total += v;
  return total / values.length;
}

export function sd(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  let total = 0;
  for (const v of values) total += (v - m) * (v - m);
  return Math.sqrt(total / (values.length - 1));
}

export function median(values: readonly number[]): number {
  return quantile(values, 0.5);
}

export function quantile(values: readonly number[], p: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/** Share of values equal to the most common value (used to drop factors that barely vary). */
export function modeShare(values: readonly number[]): number {
  if (values.length === 0) return 1;
  const counts = new Map<number, number>();
  let best = 0;
  for (const v of values) {
    const c = (counts.get(v) ?? 0) + 1;
    counts.set(v, c);
    if (c > best) best = c;
  }
  return best / values.length;
}

/** Spearman rank correlation; NaN when either side is constant. */
export function spearman(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || x.length !== y.length) return NaN;
  if (modeShare(x) === 1 || modeShare(y) === 1) return NaN;
  const r = sampleRankCorrelation(x, y);
  return Number.isFinite(r) ? r : NaN;
}

export function pearson(x: readonly number[], y: readonly number[]): number {
  if (x.length < 3 || x.length !== y.length) return NaN;
  if (modeShare(x) === 1 || modeShare(y) === 1) return NaN;
  const r = sampleCorrelation(x, y);
  return Number.isFinite(r) ? r : NaN;
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, error < 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Two-sided p-value for a correlation via the Fisher z-transform. */
export function correlationPValue(r: number, n: number): number {
  if (!Number.isFinite(r) || n < 4) return 1;
  const clipped = Math.max(-0.999999, Math.min(0.999999, r));
  const z = Math.atanh(clipped) * Math.sqrt(n - 3);
  return Math.min(1, 2 * (1 - normalCdf(Math.abs(z))));
}

/**
 * Benjamini–Hochberg false discovery rate control.
 * Returns the adjusted q-value for each p-value (same order).
 */
export function benjaminiHochberg(pValues: readonly number[]): number[] {
  const m = pValues.length;
  const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(m).fill(1);
  let running = 1;
  for (let rank = m; rank >= 1; rank--) {
    const { p, i } = order[rank - 1];
    running = Math.min(running, (p * m) / rank);
    q[i] = Math.min(1, running);
  }
  return q;
}

export interface Standardizer {
  means: number[];
  sds: number[];
}

export function fitStandardizer(X: readonly number[][]): Standardizer {
  const p = X[0]?.length ?? 0;
  const means: number[] = [];
  const sds: number[] = [];
  for (let j = 0; j < p; j++) {
    const col = X.map((row) => row[j]);
    const m = mean(col);
    const s = sd(col);
    means.push(m);
    sds.push(s > 1e-9 ? s : 1);
  }
  return { means, sds };
}

export function standardizeRow(
  row: readonly number[],
  st: Standardizer,
): number[] {
  return row.map((v, j) => (v - st.means[j]) / st.sds[j]);
}

/** Solve A x = b with Gaussian elimination and partial pivoting. */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) continue;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    if (Math.abs(M[r][r]) < 1e-12) {
      x[r] = 0;
      continue;
    }
    let total = M[r][n];
    for (let c = r + 1; c < n; c++) total -= M[r][c] * x[c];
    x[r] = total / M[r][r];
  }
  return x;
}

export interface RidgeModel {
  coef: number[];
  intercept: number;
  standardizer: Standardizer;
  lambda: number;
}

/** Ridge regression on standardised features, solved in closed form. */
export function fitRidge(
  X: readonly number[][],
  y: readonly number[],
  lambda: number,
): RidgeModel {
  const standardizer = fitStandardizer(X);
  const Z = X.map((row) => standardizeRow(row, standardizer));
  const p = standardizer.means.length;
  const yMean = mean(y);
  const A: number[][] = Array.from({ length: p }, () =>
    new Array<number>(p).fill(0),
  );
  const b = new Array<number>(p).fill(0);
  for (let i = 0; i < Z.length; i++) {
    const zi = Z[i];
    const yi = y[i] - yMean;
    for (let j = 0; j < p; j++) {
      b[j] += zi[j] * yi;
      for (let k = j; k < p; k++) A[j][k] += zi[j] * zi[k];
    }
  }
  for (let j = 0; j < p; j++) {
    for (let k = 0; k < j; k++) A[j][k] = A[k][j];
    A[j][j] += lambda;
  }
  const coef = p > 0 ? solveLinear(A, b) : [];
  return { coef, intercept: yMean, standardizer, lambda };
}

export function predictRidge(
  model: RidgeModel,
  row: readonly number[],
): number {
  const z = standardizeRow(row, model.standardizer);
  let total = model.intercept;
  for (let j = 0; j < z.length; j++) total += model.coef[j] * z[j];
  return total;
}

/** Per-feature contribution to a prediction (coefficient × standardised value). */
export function ridgeContributions(
  model: RidgeModel,
  row: readonly number[],
): number[] {
  const z = standardizeRow(row, model.standardizer);
  return z.map((v, j) => model.coef[j] * v);
}

export interface LogisticModel {
  coef: number[];
  intercept: number;
  standardizer: Standardizer;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/** L2-penalised logistic regression fitted with plain gradient descent. */
export function fitLogistic(
  X: readonly number[][],
  y: readonly number[],
  lambda = 1,
  iterations = 400,
  learningRate = 0.1,
): LogisticModel {
  const standardizer = fitStandardizer(X);
  const Z = X.map((row) => standardizeRow(row, standardizer));
  const n = Z.length;
  const p = standardizer.means.length;
  const coef = new Array<number>(p).fill(0);
  const base = Math.min(0.99, Math.max(0.01, mean(y)));
  let intercept = Math.log(base / (1 - base));
  for (let it = 0; it < iterations; it++) {
    const grad = new Array<number>(p).fill(0);
    let gradIntercept = 0;
    for (let i = 0; i < n; i++) {
      let s = intercept;
      for (let j = 0; j < p; j++) s += coef[j] * Z[i][j];
      const err = sigmoid(s) - y[i];
      gradIntercept += err;
      for (let j = 0; j < p; j++) grad[j] += err * Z[i][j];
    }
    intercept -= (learningRate * gradIntercept) / n;
    for (let j = 0; j < p; j++) {
      coef[j] -= learningRate * ((grad[j] + lambda * coef[j]) / n);
    }
  }
  return { coef, intercept, standardizer };
}

export function predictLogistic(
  model: LogisticModel,
  row: readonly number[],
): number {
  const z = standardizeRow(row, model.standardizer);
  let s = model.intercept;
  for (let j = 0; j < z.length; j++) s += model.coef[j] * z[j];
  return sigmoid(s);
}

const MINUTES_PER_DAY = 1440;

/** Signed difference a - b on a 24h clock, in (-720, 720]. */
export function circularDiff(a: number, b: number): number {
  let d = (a - b) % MINUTES_PER_DAY;
  if (d > MINUTES_PER_DAY / 2) d -= MINUTES_PER_DAY;
  if (d <= -MINUTES_PER_DAY / 2) d += MINUTES_PER_DAY;
  return d;
}

/** Median time of day that minimises total clock distance (so 11:50pm and 12:10am average to midnight). */
export function circularMedian(minutes: readonly number[]): number {
  if (minutes.length === 0) return NaN;
  let best = minutes[0];
  let bestCost = Infinity;
  for (const candidate of minutes) {
    let cost = 0;
    for (const m of minutes) cost += Math.abs(circularDiff(m, candidate));
    if (cost < bestCost) {
      bestCost = cost;
      best = candidate;
    }
  }
  return ((best % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Interquartile range of clock deviations from the circular median, in minutes. */
export function circularIqr(minutes: readonly number[]): number {
  if (minutes.length < 2) return 0;
  const centre = circularMedian(minutes);
  const deviations = minutes.map((m) => circularDiff(m, centre));
  return quantile(deviations, 0.75) - quantile(deviations, 0.25);
}

/** Least-squares slope of y over x = 0..n-1. */
export function slope(values: readonly number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  return den === 0 ? 0 : num / den;
}

/** Ranks with ties sharing their average rank (1-based). */
export function midranks(values: readonly number[]): number[] {
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(values.length);
  let k = 0;
  while (k < order.length) {
    let end = k;
    while (end + 1 < order.length && order[end + 1].v === order[k].v) end++;
    const rank = (k + end) / 2 + 1;
    for (let j = k; j <= end; j++) ranks[order[j].i] = rank;
    k = end + 1;
  }
  return ranks;
}

export function shuffleInPlace<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Small seeded random generator (mulberry32) for reproducible demo and test data. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-12);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
