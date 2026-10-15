import {
  benjaminiHochberg,
  circularDiff,
  circularMedian,
  correlationPValue,
  fitLogistic,
  fitRidge,
  normalCdf,
  predictLogistic,
  predictRidge,
  solveLinear,
  spearman,
} from "../stats";

describe("stats helpers", () => {
  test("spearman handles perfect, reversed, tied and constant data", () => {
    expect(spearman([1, 2, 3, 4, 5], [10, 20, 30, 40, 50])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])).toBeCloseTo(-1);
    // Monotonic but non-linear is still a perfect rank correlation.
    expect(spearman([1, 2, 3, 4, 5], [1, 4, 9, 16, 25])).toBeCloseTo(1);
    // Ties use mid-ranks: known value from scipy.stats.spearmanr.
    expect(spearman([1, 2, 2, 3], [1, 2, 3, 4])).toBeCloseTo(0.9486833, 5);
    expect(Number.isNaN(spearman([1, 1, 1, 1], [1, 2, 3, 4]))).toBe(true);
  });

  test("normal CDF matches known values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });

  test("correlation p-value shrinks with sample size", () => {
    expect(correlationPValue(0.3, 20)).toBeGreaterThan(0.05);
    expect(correlationPValue(0.3, 200)).toBeLessThan(0.001);
    expect(correlationPValue(0, 50)).toBeCloseTo(1, 6);
  });

  test("Benjamini–Hochberg matches the textbook example", () => {
    // From Benjamini & Hochberg (1995)-style worked example.
    const p = [0.01, 0.04, 0.03, 0.005];
    const q = benjaminiHochberg(p);
    expect(q[3]).toBeCloseTo(0.02);
    expect(q[0]).toBeCloseTo(0.02);
    expect(q[2]).toBeCloseTo(0.04);
    expect(q[1]).toBeCloseTo(0.04);
  });

  test("Gaussian elimination solves a known system", () => {
    const x = solveLinear(
      [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2],
      ],
      [8, -11, -3],
    );
    expect(x[0]).toBeCloseTo(2);
    expect(x[1]).toBeCloseTo(3);
    expect(x[2]).toBeCloseTo(-1);
  });

  test("ridge recovers an exact linear rule with tiny lambda and shrinks with large lambda", () => {
    const X: number[][] = [];
    const y: number[] = [];
    for (let i = 0; i < 30; i++) {
      const a = (i % 7) - 3;
      const b = ((i * 3) % 5) - 2;
      X.push([a, b]);
      y.push(1 + 2 * a - 3 * b);
    }
    const exact = fitRidge(X, y, 1e-6);
    expect(predictRidge(exact, [1, 1])).toBeCloseTo(0, 3);
    expect(predictRidge(exact, [2, -1])).toBeCloseTo(8, 3);
    const shrunk = fitRidge(X, y, 1e6);
    const mean = y.reduce((s, v) => s + v, 0) / y.length;
    expect(predictRidge(shrunk, [2, -1])).toBeCloseTo(mean, 1);
  });

  test("logistic regression learns a clear split", () => {
    const X = Array.from({ length: 40 }, (_, i) => [i < 20 ? 0 : 1]);
    const y = X.map(([v], i) =>
      v === 1 ? (i % 5 === 0 ? 0 : 1) : i % 5 === 0 ? 1 : 0,
    );
    const model = fitLogistic(X, y, 0.1, 800, 0.3);
    expect(predictLogistic(model, [1])).toBeGreaterThan(0.65);
    expect(predictLogistic(model, [0])).toBeLessThan(0.35);
  });

  test("circular median handles times around midnight", () => {
    expect(circularDiff(10, 1430)).toBe(20);
    const m = circularMedian([1430, 1435, 5, 10, 15]);
    expect(Math.abs(circularDiff(m, 5))).toBeLessThanOrEqual(10);
  });
});
