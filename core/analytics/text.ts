import type { FactorDef, SymptomDef } from "./types";

export function factorWhen(
  def: FactorDef,
  side: "more" | "less" | "yes",
  nextDay: boolean,
): string {
  if (def.kind === "yesno") {
    if (nextDay)
      return def.dayAfter ?? `the day after ${def.label.toLowerCase()}`;
    return def.onDays ?? `on days with ${def.label.toLowerCase()}`;
  }
  const word =
    side === "less"
      ? (def.less ?? `less ${def.label.toLowerCase()}`)
      : (def.more ?? `more ${def.label.toLowerCase()}`);
  const prefix = nextDay
    ? (def.nextPrefix ?? "the day after")
    : (def.dayPrefix ?? "on days with");
  return `${prefix} ${word}`;
}

/** Short driver wording for forecasts, e.g. "less sleep than usual" or "Skipped breakfast". */
export function factorDriver(def: FactorDef, above: boolean): string {
  if (def.kind === "yesno")
    return above ? def.label : `no ${def.label.toLowerCase()}`;
  const word = above
    ? (def.more ?? `more ${def.label.toLowerCase()}`)
    : (def.less ?? `less ${def.label.toLowerCase()}`);
  return word.includes(" than ") || word.includes("-than-")
    ? word
    : `${word} than usual`;
}

export function symptomChange(def: SymptomDef, up: boolean): string {
  return up ? def.up : def.down;
}

export function fmt(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "–";
  const factor = Math.pow(10, decimals);
  return String(Math.round(value * factor) / factor);
}

export function strengthLabel(rho: number): "strong" | "moderate" | "weak" {
  const a = Math.abs(rho);
  if (a >= 0.5) return "strong";
  if (a >= 0.3) return "moderate";
  return "weak";
}

export function strengthDots(rho: number): number {
  const s = strengthLabel(rho);
  return s === "strong" ? 3 : s === "moderate" ? 2 : 1;
}

export function capitalise(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/** Word scale used for forecasts when numbers are switched off. */
export function relativeWord(zScore: number): string {
  if (zScore <= -1) return "much lower than usual";
  if (zScore <= -0.35) return "a bit lower than usual";
  if (zScore < 0.35) return "about usual";
  if (zScore < 1) return "a bit higher than usual";
  return "much higher than usual";
}

export const PATTERN_NOT_PROOF =
  "Based on your own logs. A pattern, not proof of cause.";
