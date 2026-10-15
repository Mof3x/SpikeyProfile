import { DEFAULT_INTAKE_CONFIG } from "@/core/dataConstants";
import type {
  CalendarEvent,
  CustomTracker,
  CustomTrackerEntry,
  DemoDataBundle,
  ExerciseEntry,
  FocusSession,
  IntakeEntry,
  PeriodDay,
  QuickLogAction,
  QuickLogEntry,
  SymptomEntry,
  TodoItem,
} from "@/core/DataContext";
import {
  WEATHER_METRICS,
  withDerivedWeather,
} from "@/core/sources/weatherMetrics";
import { addDays, dayKey, parseDayKey, type DayKey } from "./dates";
import { gaussian, seededRandom } from "./stats";
import type { AnalyticsInput, ExternalSourceData } from "./types";

export interface SyntheticOptions {
  days?: number;
  seed?: number;
  now?: Date;
  /** Plant the known effects (default true). With false, symptoms are pure noise. */
  effects?: boolean;
  /** "planted": quiet spells before periods and after heavier days; "random": same amount, no cause. */
  gaps?: "planted" | "random" | "none";
  /** Plant two "steady meds + feeling better → logging slips" episodes (needs 170+ days). */
  drift?: boolean;
}

export interface SyntheticData {
  bundle: DemoDataBundle;
  weather: ExternalSourceData;
  input: AnalyticsInput;
  inactiveDays: Set<DayKey>;
  periodStarts: DayKey[];
}

export const DEMO_ACTIONS: QuickLogAction[] = [
  {
    id: "1",
    name: "Morning Meds",
    icon: "sun",
    category: "medication",
    enabled: true,
  },
  {
    id: "2",
    name: "Evening Meds",
    icon: "moon",
    category: "medication",
    enabled: true,
  },
  {
    id: "3",
    name: "Drank Water",
    icon: "droplet",
    category: "habit",
    enabled: true,
  },
  {
    id: "4",
    name: "Took a Break",
    icon: "coffee",
    category: "habit",
    enabled: true,
  },
  {
    id: "5",
    name: "Went Outside",
    icon: "wind",
    category: "habit",
    enabled: true,
  },
];

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const score = (v: number) => Math.round(clamp(v, 1, 10));

export function generateSyntheticData(
  options: SyntheticOptions = {},
): SyntheticData {
  const days = options.days ?? 120;
  const effects = options.effects ?? true;
  const gaps = options.gaps ?? "planted";
  const now = options.now ?? new Date();
  const rand = seededRandom(options.seed ?? 42);
  const g = () => gaussian(rand);
  const fx = (v: number) => (effects ? v : 0);

  const today = dayKey(now);
  const dayList: DayKey[] = [];
  for (let i = days; i >= 1; i--) dayList.push(addDays(today, -i));

  const at = (day: DayKey, minutes: number) => {
    const d = parseDayKey(day);
    const m = clamp(Math.round(minutes), 0, 1439);
    d.setHours(Math.floor(m / 60), m % 60, 0, 0);
    return d;
  };

  // Cycle: ~28 days, 5-day periods.
  const periodStarts: DayKey[] = [];
  let next = addDays(dayList[0], Math.floor(rand() * 20));
  while (next <= addDays(today, 40)) {
    periodStarts.push(next);
    next = addDays(next, 28 + Math.round(g() * 1.2));
  }
  const periodSet = new Set<DayKey>();
  periodStarts.forEach((s) => {
    for (let k = 0; k < 5; k++) periodSet.add(addDays(s, k));
  });
  const premenstrual = (day: DayKey) =>
    periodStarts.some((s) => {
      const diff = Math.round(
        (parseDayKey(s).getTime() - parseDayKey(day).getTime()) / 86400000,
      );
      return diff >= 1 && diff <= 7;
    });

  // Weather: seasonal temperature, humidity noise, pressure random walk.
  const weatherDays: Record<DayKey, Record<string, number>> = {};
  let pressure = 1013;
  for (const day of [...dayList, today, addDays(today, 1)]) {
    const doy = Math.floor(
      (parseDayKey(day).getTime() -
        new Date(parseDayKey(day).getFullYear(), 0, 1).getTime()) /
        86400000,
    );
    const tempMax =
      14 + 8 * Math.sin(((doy - 110) / 365) * 2 * Math.PI) + g() * 3;
    pressure = 1013 + 0.6 * (pressure - 1013) + g() * 6;
    const humidity = clamp(70 + g() * 12, 35, 99);
    weatherDays[day] = {
      tempMax: Math.round(tempMax * 10) / 10,
      tempMin: Math.round((tempMax - 6 - rand() * 4) * 10) / 10,
      feelsLikeMax: Math.round((tempMax + g()) * 10) / 10,
      humidity: Math.round(humidity),
      pressure: Math.round(pressure * 10) / 10,
      rain: rand() < 0.35 ? Math.round(rand() * 12 * 10) / 10 : 0,
      rainHours: rand() < 0.35 ? Math.round(rand() * 8) : 0,
      sunshine: Math.round(rand() * 10 * 10) / 10,
    };
  }
  withDerivedWeather(weatherDays);

  const symptomEntries: SymptomEntry[] = [];
  const quickLogEntries: QuickLogEntry[] = [];
  const exerciseEntries: ExerciseEntry[] = [];
  const intakeEntries: IntakeEntry[] = [];
  const focusSessions: FocusSession[] = [];
  const todos: TodoItem[] = [];
  const calendarEvents: CalendarEvent[] = [];
  const trackerEntries: CustomTrackerEntry[] = [];
  const trackers: CustomTracker[] = [
    {
      id: "t-pain",
      name: "Pain level",
      inputType: "slider",
      icon: "thermometer",
      enabled: true,
    },
  ];

  const goodStretch = (i: number) =>
    options.drift && ((i >= 21 && i < 56) || (i >= 97 && i < 132));
  const slipped = (i: number) =>
    options.drift && ((i >= 56 && i < 76) || (i >= 132 && i < 152));
  const harder = (i: number) =>
    options.drift && ((i >= 60 && i < 76) || (i >= 136 && i < 152));

  let latent = 0;
  let caffeineLateYesterday = false;
  let alcoholYesterday = 0;
  const loads: number[] = [];
  const perDay: { day: DayKey; idx: number; load: number }[] = [];
  let uid = 0;
  const id = (p: string) => `${p}-${++uid}`;

  dayList.forEach((day, i) => {
    const wd = parseDayKey(day).getDay();
    latent = effects ? 0.5 * latent + g() * 0.8 : g() * 0.8;
    const sleep = clamp(
      Math.round((7 + g() * 1.0 - fx(caffeineLateYesterday ? 1.4 : 0)) * 2) / 2,
      3.5,
      10,
    );
    const exercised = rand() < 0.4;
    const skippedBreakfast = rand() < 0.25;
    const caffeineCups = rand() < 0.8 ? 1 + Math.floor(rand() * 3) : 0;
    const caffeineLate = caffeineCups > 0 && rand() < 0.3;
    const alcohol = rand() < 0.25 ? 1 + Math.floor(rand() * 4) : 0;
    const weather = weatherDays[day];
    const lift = goodStretch(i) ? 1 : harder(i) ? -1.2 : 0;

    const mood =
      5.5 +
      latent +
      fx(exercised ? 1.6 : 0) -
      fx(alcoholYesterday > 0 ? 1.3 : 0) +
      lift +
      g() * 0.9;
    const energy =
      5.5 + 0.5 * latent + fx((sleep - 7) * 1.1) + lift * 0.8 + g() * 0.9;
    const brainFog =
      4.5 -
      0.5 * latent +
      fx(weather.pressureDrop ? 2.4 : 0) -
      lift * 0.8 +
      g() * 0.9;
    const sensory =
      4 -
      0.3 * latent +
      fx(premenstrual(day) ? 2 : 0) +
      fx(weather.humidity > 80 ? 1.6 : 0) -
      lift * 0.8 +
      g() * 0.9;
    const exec =
      4.5 -
      0.4 * latent +
      fx(skippedBreakfast ? 1.7 : 0) -
      lift * 0.8 +
      g() * 0.9;

    const evening = 20 * 60 + g() * 60;
    const entry: SymptomEntry = {
      id: id("s"),
      timestamp: at(day, evening),
      mood: score(mood),
      energy: score(energy),
      brainFog: score(brainFog),
      sensoryOverload: score(sensory),
      executiveDysfunction: score(exec),
      sleepHours: sleep,
      sleepQuality: score(5 + (sleep - 7) * 1.2 + g()),
      source: "manual",
    };
    symptomEntries.push(entry);
    if (rand() < 0.35) {
      symptomEntries.push({
        ...entry,
        id: id("s"),
        timestamp: at(day, 9 * 60 + g() * 40),
        energy: score(energy + fx(1.2)),
        sleepHours: undefined,
        sleepQuality: undefined,
      });
    }
    const load =
      (11 -
        entry.mood +
        11 -
        entry.energy +
        entry.brainFog +
        entry.sensoryOverload +
        entry.executiveDysfunction) /
      5;
    loads.push(load);
    perDay.push({ day, idx: i, load });

    const morningRate = slipped(i) ? 0.4 : 0.95;
    if (rand() < morningRate) {
      quickLogEntries.push({
        id: id("q"),
        actionId: "1",
        actionName: "Morning Meds",
        timestamp: at(day, 8.5 * 60 + g() * 20),
      });
    }
    const eveningRate = effects && wd === 5 ? 0.5 : 0.95;
    if (rand() < eveningRate) {
      quickLogEntries.push({
        id: id("q"),
        actionId: "2",
        actionName: "Evening Meds",
        timestamp: at(day, 20.5 * 60 + g() * 25),
      });
    }
    const water = 2 + Math.floor(rand() * 5);
    for (let k = 0; k < water; k++) {
      quickLogEntries.push({
        id: id("q"),
        actionId: "3",
        actionName: "Drank Water",
        timestamp: at(day, 9 * 60 + rand() * 600),
      });
    }
    if (rand() < 0.5) {
      quickLogEntries.push({
        id: id("q"),
        actionId: "5",
        actionName: "Went Outside",
        timestamp: at(day, 12 * 60 + rand() * 300),
      });
    }
    if (rand() < 0.6) {
      quickLogEntries.push({
        id: id("q"),
        actionId: "4",
        actionName: "Took a Break",
        timestamp: at(day, 11 * 60 + rand() * 360),
      });
    }

    if (exercised) {
      const intensity = (1 + Math.floor(rand() * 3)) as 1 | 2 | 3;
      exerciseEntries.push({
        id: id("e"),
        timestamp: at(day, 17 * 60 + rand() * 120),
        type: (["walk", "run", "gym", "yoga", "cycle"] as const)[
          Math.floor(rand() * 5)
        ],
        minutes: 20 + Math.floor(rand() * 5) * 10,
        intensity,
      });
    }

    const tagPool = DEFAULT_INTAKE_CONFIG.tags;
    const pickTags = () => tagPool.filter(() => rand() < 0.2);
    if (!skippedBreakfast) {
      intakeEntries.push({
        id: id("i"),
        timestamp: at(day, 7.5 * 60 + rand() * 90),
        category: "meal",
        item: "Breakfast",
        tags: pickTags(),
      });
    }
    intakeEntries.push({
      id: id("i"),
      timestamp: at(day, 12.5 * 60 + rand() * 60),
      category: "meal",
      item: "Lunch",
      tags: pickTags(),
    });
    intakeEntries.push({
      id: id("i"),
      timestamp: at(day, 18.5 * 60 + rand() * 150),
      category: "meal",
      item: "Dinner",
      tags: pickTags(),
    });
    for (let k = 0; k < caffeineCups; k++) {
      const late = caffeineLate && k === caffeineCups - 1;
      intakeEntries.push({
        id: id("i"),
        timestamp: at(
          day,
          late ? 15 * 60 + rand() * 120 : 8 * 60 + rand() * 180,
        ),
        category: "substance",
        item: "caffeine",
        amount: 1,
      });
    }
    if (alcohol > 0) {
      intakeEntries.push({
        id: id("i"),
        timestamp: at(day, 20 * 60 + rand() * 120),
        category: "substance",
        item: "alcohol",
        amount: alcohol,
      });
    }

    const sessions = Math.floor(rand() * 4);
    for (let k = 0; k < sessions; k++)
      focusSessions.push({
        id: id("f"),
        endedAt: at(day, 10 * 60 + k * 60),
        minutes: 25,
      });

    const done = Math.floor(rand() * 4);
    for (let k = 0; k < done; k++) {
      todos.push({
        id: id("td"),
        text: `Task ${uid}`,
        completed: true,
        createdAt: at(day, 9 * 60),
        completedAt: at(day, 15 * 60 + k * 30),
      });
    }
    const events = Math.floor(rand() * 3);
    for (let k = 0; k < events; k++) {
      calendarEvents.push({
        id: id("c"),
        title: rand() < 0.15 ? "GP appointment" : "Meeting",
        date: at(day, 11 * 60),
        type: "event",
      });
    }
    trackerEntries.push({
      id: id("tr"),
      trackerId: "t-pain",
      value: score(3 + g() * 1.5),
      timestamp: at(day, 21 * 60),
    });

    caffeineLateYesterday = caffeineLate;
    alcoholYesterday = alcohol;
  });

  // Quiet spells: whole days with nothing logged.
  const inactive = new Set<DayKey>();
  if (gaps !== "none") {
    const loadByDay = new Map(perDay.map((p) => [p.day, p.load]));
    let i = 3;
    while (i < dayList.length - 3) {
      const day = dayList[i];
      let start = false;
      if (gaps === "planted") {
        const periodSoon =
          periodStarts.includes(addDays(day, 1)) ||
          periodStarts.includes(addDays(day, 2));
        const l0 = loadByDay.get(addDays(day, -2));
        const l1 = loadByDay.get(addDays(day, -1));
        const l2 = loadByDay.get(day);
        const rising =
          l0 !== undefined &&
          l1 !== undefined &&
          l2 !== undefined &&
          l2 - l0 >= 1.2;
        start =
          (periodSoon && rand() < 0.75) ||
          (rising && rand() < 0.45) ||
          rand() < 0.008;
      } else {
        start = rand() < 0.045;
      }
      if (start) {
        const len = 2 + Math.floor(rand() * 2);
        for (let k = 1; k <= len; k++) inactive.add(dayList[i + k]);
        // Spells only need one logged day in between, so streak length carries no planted signal.
        i += len + 1;
      } else i++;
    }
  }
  const keep = <T>(items: T[], when: (t: T) => Date | string) =>
    items.filter((t) => !inactive.has(dayKey(new Date(when(t)))));

  const periodDays: PeriodDay[] = [...periodSet]
    .filter((d) => d < today && d >= dayList[0] && !inactive.has(d))
    .sort()
    .map((date) => ({ date, flow: "medium" as const }));

  const bundle: DemoDataBundle = {
    symptomEntries: keep(symptomEntries, (e) => e.timestamp),
    quickLogActions: DEMO_ACTIONS,
    quickLogEntries: keep(quickLogEntries, (e) => e.timestamp),
    todos: keep(todos, (t) => t.completedAt ?? t.createdAt),
    calendarEvents,
    exerciseEntries: keep(exerciseEntries, (e) => e.timestamp),
    intakeEntries: keep(intakeEntries, (e) => e.timestamp),
    focusSessions: keep(focusSessions, (f) => f.endedAt),
    periodDays,
    customTrackers: trackers,
    customTrackerEntries: keep(trackerEntries, (e) => e.timestamp),
  };

  const weather: ExternalSourceData = {
    id: "weather",
    label: "Weather",
    metrics: WEATHER_METRICS,
    days: weatherDays,
  };

  const input: AnalyticsInput = {
    now,
    symptomEntries: bundle.symptomEntries,
    quickLogActions: bundle.quickLogActions,
    quickLogEntries: bundle.quickLogEntries,
    todos: bundle.todos,
    calendarEvents: bundle.calendarEvents,
    countdownTimers: [],
    customTrackers: bundle.customTrackers,
    customTrackerEntries: bundle.customTrackerEntries,
    exerciseEntries: bundle.exerciseEntries,
    intakeEntries: bundle.intakeEntries,
    intakeConfig: DEFAULT_INTAKE_CONFIG,
    focusSessions: bundle.focusSessions,
    periodDays: bundle.periodDays,
    dayNotes: [],
    ageRange: null,
    external: [weather],
  };

  return { bundle, weather, input, inactiveDays: inactive, periodStarts };
}
