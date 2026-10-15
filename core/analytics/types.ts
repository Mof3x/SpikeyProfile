import type {
  AgeRange,
  CalendarEvent,
  CountdownTimer,
  CustomTracker,
  CustomTrackerEntry,
  DayNote,
  ExerciseEntry,
  FocusSession,
  IntakeConfig,
  IntakeEntry,
  PeriodDay,
  QuickLogAction,
  QuickLogEntry,
  SymptomEntry,
  TodoItem,
} from "@/core/DataContext";
import type { DayKey } from "./dates";

export type SymptomKey =
  | "mood"
  | "energy"
  | "brainFog"
  | "sensoryOverload"
  | "executiveDysfunction";

export interface SymptomDef {
  key: SymptomKey;
  label: string;
  higherIsWorse: boolean;
  /** Phrase after "You tend to have ..." when the score goes up. */
  up: string;
  /** Phrase after "You tend to have ..." when the score goes down. */
  down: string;
}

/** Scales run 1–10 (see SymptomSlider). */
export const SCALE_MIN = 1;
export const SCALE_MAX = 10;

export const SYMPTOMS: SymptomDef[] = [
  {
    key: "mood",
    label: "Mood",
    higherIsWorse: false,
    up: "a better mood",
    down: "a lower mood",
  },
  {
    key: "energy",
    label: "Energy",
    higherIsWorse: false,
    up: "more energy",
    down: "less energy",
  },
  {
    key: "brainFog",
    label: "Brain fog",
    higherIsWorse: true,
    up: "more brain fog",
    down: "less brain fog",
  },
  {
    key: "sensoryOverload",
    label: "Sensory overload",
    higherIsWorse: true,
    up: "more sensory overload",
    down: "less sensory overload",
  },
  {
    key: "executiveDysfunction",
    label: "Executive function",
    higherIsWorse: true,
    up: "a harder time getting things done",
    down: "an easier time getting things done",
  },
];

export const SYMPTOM_BY_KEY: Record<SymptomKey, SymptomDef> =
  Object.fromEntries(SYMPTOMS.map((s) => [s.key, s])) as Record<
    SymptomKey,
    SymptomDef
  >;

/** Overall "load" for a day: 1 = very easy, 10 = very heavy. */
export function loadFromSymptoms(
  symptoms: Partial<Record<SymptomKey, number>>,
): number | undefined {
  const parts: number[] = [];
  for (const def of SYMPTOMS) {
    const v = symptoms[def.key];
    if (v === undefined) continue;
    parts.push(def.higherIsWorse ? v : SCALE_MAX + SCALE_MIN - v);
  }
  if (parts.length === 0) return undefined;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

export type FactorGroup =
  | "sleep"
  | "activity"
  | "body"
  | "meds"
  | "habits"
  | "food"
  | "substances"
  | "weather"
  | "cycle"
  | "schedule"
  | "trackers"
  | "imported";

export const FACTOR_GROUP_LABELS: Record<FactorGroup, string> = {
  sleep: "Sleep",
  activity: "Activity",
  body: "Body",
  meds: "Medication",
  habits: "Habits",
  food: "Food & drink",
  substances: "Substances",
  weather: "Weather",
  cycle: "Cycle",
  schedule: "Schedule",
  trackers: "My trackers",
  imported: "Imported",
};

export type FactorKind = "number" | "yesno";

export interface FactorPhrasing {
  /** Number factors: "more sleep" / "less sleep". */
  more?: string;
  less?: string;
  /** Number factors: prefix before more/less on the same day. Default "on days with". */
  dayPrefix?: string;
  /** Number factors: prefix before more/less for the next-day effect. Default "the day after". */
  nextPrefix?: string;
  /** Yes/no factors: full same-day phrase, e.g. "on days you go outside". */
  onDays?: string;
  /** Yes/no factors: full next-day phrase, e.g. "the day after you go outside". */
  dayAfter?: string;
}

export interface FactorDef extends FactorPhrasing {
  id: string;
  label: string;
  group: FactorGroup;
  kind: FactorKind;
  unit?: string;
  decimals?: number;
  /** Value for day D is known before D starts (calendar, weather forecast, weekday, cycle estimate). */
  knownInAdvance?: boolean;
  /** Logged by hand: a day only counts as "none" if the person was using the app that day. */
  manual?: boolean;
  /** Also test whether this factor goes with how the *next* day feels. */
  testNextDay?: boolean;
  /** Related factors (e.g. all the air-pressure measures); only the strongest is reported per symptom. */
  family?: string;
}

export interface ExternalMetric extends FactorPhrasing {
  key: string;
  label: string;
  group: FactorGroup;
  kind: FactorKind;
  unit?: string;
  decimals?: number;
  knownInAdvance?: boolean;
  testNextDay?: boolean;
  /** Fill a built-in factor (e.g. "sleep.hours") when nothing was logged by hand. */
  mergeInto?: string;
  family?: string;
}

export interface ExternalSourceData {
  id: string;
  label: string;
  metrics: ExternalMetric[];
  days: Record<DayKey, Record<string, number>>;
}

export interface AnalyticsInput {
  now: Date;
  symptomEntries: SymptomEntry[];
  quickLogActions: QuickLogAction[];
  quickLogEntries: QuickLogEntry[];
  todos: TodoItem[];
  calendarEvents: CalendarEvent[];
  countdownTimers: CountdownTimer[];
  customTrackers: CustomTracker[];
  customTrackerEntries: CustomTrackerEntry[];
  exerciseEntries: ExerciseEntry[];
  intakeEntries: IntakeEntry[];
  intakeConfig: IntakeConfig;
  focusSessions: FocusSession[];
  periodDays: PeriodDay[];
  dayNotes: DayNote[];
  ageRange: AgeRange | null;
  external: ExternalSourceData[];
}

export interface DailyRow {
  day: DayKey;
  /** After today: only "known in advance" values are filled. */
  future: boolean;
  /** Anything logged by hand that day. */
  active: boolean;
  symptoms: Partial<Record<SymptomKey, number>>;
  load?: number;
  /** Factor id → value. Missing keys mean "unknown", not zero. */
  values: Record<string, number>;
}

export interface DailyTable {
  rows: DailyRow[];
  byDay: Map<DayKey, DailyRow>;
  factors: FactorDef[];
  factorById: Map<string, FactorDef>;
  today: DayKey;
  firstDay: DayKey | null;
}
