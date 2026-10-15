export type DayKey = string;

const MS_PER_DAY = 86400000;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function dayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = parseDayKey(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** Whole days from a to b (b - a). Rounded so daylight-saving shifts don't matter. */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round(
    (parseDayKey(b).getTime() - parseDayKey(a).getTime()) / MS_PER_DAY,
  );
}

export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  let current = from;
  let guard = 0;
  while (current <= to && guard < 20000) {
    out.push(current);
    current = addDays(current, 1);
    guard++;
  }
  return out;
}

export function weekdayOf(key: DayKey): number {
  return parseDayKey(key).getDay();
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export const WEEKDAY_NAMES = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDayShort(key: DayKey): string {
  const d = parseDayKey(key);
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
}

export function formatWeekday(key: DayKey): string {
  return SHORT_DAYS[parseDayKey(key).getDay()];
}

export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mins = m % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(mins)}${suffix}`;
}

/** Plain-words time of day, used when numbers are switched off. */
export function describeTimeOfDay(minutes: number): string {
  const h = minutes / 60;
  if (h < 5) return "overnight";
  if (h < 9) return "early in the morning";
  if (h < 12) return "in the late morning";
  if (h < 14) return "around midday";
  if (h < 17) return "in the afternoon";
  if (h < 20) return "in the early evening";
  return "late in the evening";
}

export function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}
