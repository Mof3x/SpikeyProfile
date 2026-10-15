import { dayKey, type DayKey } from "@/core/analytics/dates";
import type { ExternalMetric } from "@/core/analytics/types";

export interface CsvTable {
  headers: string[];
  rows: string[][];
}

export interface CsvColumnMapping {
  column: number;
  label: string;
  include: boolean;
  combine: "mean" | "sum";
}

export interface CsvMapping {
  dateColumn: number;
  dayFirst: boolean;
  columns: CsvColumnMapping[];
}

/** RFC 4180-style parser: quoted fields, escaped quotes, CRLF, and comma/semicolon/tab delimiters. */
export function parseCsv(text: string): CsvTable {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best,
  );
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  const [headers = [], ...body] = rows;
  return { headers: headers.map((h) => h.trim()), rows: body };
}

const NUMBER = /^[-+]?\d+([.,]\d+)?$/;

export function parseNumber(value: string): number | undefined {
  const v = value.trim().replace(/\s/g, "");
  if (!NUMBER.test(v)) return undefined;
  return parseFloat(v.replace(",", "."));
}

/** Parses ISO dates, d/m/y or m/d/y, and epoch seconds/milliseconds. */
export function parseDateCell(value: string, dayFirst = true): Date | null {
  const v = value.trim();
  if (!v) return null;
  if (/^\d{10}(\d{3})?$/.test(v)) {
    const n = Number(v);
    return new Date(v.length === 13 ? n : n * 1000);
  }
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (iso) {
    return new Date(
      +iso[1],
      +iso[2] - 1,
      +iso[3],
      iso[4] ? +iso[4] : 12,
      iso[5] ? +iso[5] : 0,
    );
  }
  const dmy = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (dmy) {
    const a = +dmy[1];
    const b = +dmy[2];
    const y = dmy[3].length === 2 ? 2000 + +dmy[3] : +dmy[3];
    const [day, month] = dayFirst ? [a, b] : [b, a];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return new Date(y, month - 1, day, 12, 0);
  }
  return null;
}

function share<T>(values: T[], test: (v: T) => boolean): number {
  const filled = values.filter((v) => String(v).trim() !== "");
  if (filled.length === 0) return 0;
  return filled.filter(test).length / filled.length;
}

export function guessMapping(table: CsvTable): CsvMapping {
  const col = (i: number) => table.rows.map((r) => r[i] ?? "");
  let dateColumn = table.headers.findIndex(
    (h, i) =>
      /date|day|time/i.test(h) &&
      share(col(i), (v) => parseDateCell(v) !== null) >= 0.8,
  );
  if (dateColumn < 0) {
    dateColumn = table.headers.findIndex(
      (_, i) => share(col(i), (v) => parseDateCell(v) !== null) >= 0.8,
    );
  }
  let dayFirst = true;
  if (dateColumn >= 0) {
    for (const v of col(dateColumn)) {
      const m = v.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-]/);
      if (!m) continue;
      if (+m[1] > 12) {
        dayFirst = true;
        break;
      }
      if (+m[2] > 12) {
        dayFirst = false;
        break;
      }
    }
  }
  const columns: CsvColumnMapping[] = [];
  table.headers.forEach((h, i) => {
    if (i === dateColumn) return;
    if (share(col(i), (v) => parseNumber(v) !== undefined) < 0.8) return;
    const sumLike =
      /steps|count|minutes|mins|calories|kcal|ml|units|total|amount|distance/i.test(
        h,
      );
    columns.push({
      column: i,
      label: h || `Column ${i + 1}`,
      include: true,
      combine: sumLike ? "sum" : "mean",
    });
  });
  return { dateColumn, dayFirst, columns };
}

const keyFor = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "value";

export function csvToDaily(
  table: CsvTable,
  mapping: CsvMapping,
): {
  metrics: ExternalMetric[];
  days: Record<DayKey, Record<string, number>>;
  rowsUsed: number;
} {
  const included = mapping.columns.filter((c) => c.include);
  const sums = new Map<string, { total: number; count: number }>();
  let rowsUsed = 0;
  for (const row of table.rows) {
    const date = parseDateCell(row[mapping.dateColumn] ?? "", mapping.dayFirst);
    if (!date) continue;
    rowsUsed++;
    const day = dayKey(date);
    for (const c of included) {
      const v = parseNumber(row[c.column] ?? "");
      if (v === undefined) continue;
      const k = `${day}|${keyFor(c.label)}`;
      const s = sums.get(k) ?? { total: 0, count: 0 };
      s.total += v;
      s.count++;
      sums.set(k, s);
    }
  }
  const combineByKey = new Map(
    included.map((c) => [keyFor(c.label), c.combine]),
  );
  const days: Record<DayKey, Record<string, number>> = {};
  for (const [k, s] of sums) {
    const [day, key] = k.split("|");
    const value = combineByKey.get(key) === "sum" ? s.total : s.total / s.count;
    (days[day] ??= {})[key] = Math.round(value * 100) / 100;
  }
  const metrics: ExternalMetric[] = included.map((c) => ({
    key: keyFor(c.label),
    label: c.label,
    group: "imported",
    kind: "number",
    more: `more ${c.label.toLowerCase()}`,
    less: `less ${c.label.toLowerCase()}`,
    testNextDay: true,
  }));
  return { metrics, days, rowsUsed };
}
