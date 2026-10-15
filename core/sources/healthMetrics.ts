import type { ExternalMetric } from "@/core/analytics/types";

export type HealthDataType =
  | "steps"
  | "activeEnergy"
  | "exercise"
  | "workouts"
  | "sleep"
  | "heart"
  | "hrv"
  | "respiratory"
  | "oxygen"
  | "weight"
  | "temperature"
  | "cycle"
  | "water"
  | "caffeine"
  | "nutrition"
  | "mindfulness";

export interface HealthTypeInfo {
  id: HealthDataType;
  label: string;
  group: "Activity" | "Sleep" | "Heart" | "Body" | "Cycle" | "Intake" | "Mind";
  metrics: string[];
}

export const HEALTH_TYPES: HealthTypeInfo[] = [
  { id: "steps", label: "Steps", group: "Activity", metrics: ["steps"] },
  {
    id: "activeEnergy",
    label: "Active energy",
    group: "Activity",
    metrics: ["activeEnergy"],
  },
  {
    id: "exercise",
    label: "Exercise minutes",
    group: "Activity",
    metrics: ["exerciseMinutes"],
  },
  {
    id: "workouts",
    label: "Workouts",
    group: "Activity",
    metrics: ["workouts", "workoutMinutes"],
  },
  {
    id: "sleep",
    label: "Sleep",
    group: "Sleep",
    metrics: [
      "sleepHours",
      "timeInBed",
      "bedtime",
      "wakeTime",
      "deepShare",
      "remShare",
    ],
  },
  {
    id: "heart",
    label: "Heart rate",
    group: "Heart",
    metrics: ["restingHr", "avgHr"],
  },
  {
    id: "hrv",
    label: "Heart rate variability",
    group: "Heart",
    metrics: ["hrv"],
  },
  {
    id: "respiratory",
    label: "Breathing rate",
    group: "Heart",
    metrics: ["respiratoryRate"],
  },
  { id: "oxygen", label: "Blood oxygen", group: "Heart", metrics: ["spo2"] },
  { id: "weight", label: "Weight", group: "Body", metrics: ["weight"] },
  {
    id: "temperature",
    label: "Body temperature",
    group: "Body",
    metrics: ["bodyTemp", "basalTemp"],
  },
  {
    id: "cycle",
    label: "Periods and cycle",
    group: "Cycle",
    metrics: ["menstruationFlow", "ovulationTest", "cervicalMucus"],
  },
  { id: "water", label: "Water", group: "Intake", metrics: ["water"] },
  {
    id: "caffeine",
    label: "Caffeine",
    group: "Intake",
    metrics: ["caffeineMg"],
  },
  {
    id: "nutrition",
    label: "Calories eaten",
    group: "Intake",
    metrics: ["dietaryEnergy"],
  },
  {
    id: "mindfulness",
    label: "Mindfulness",
    group: "Mind",
    metrics: ["mindfulMinutes"],
  },
];

const n = (
  key: string,
  label: string,
  group: ExternalMetric["group"],
  unit: string | undefined,
  more: string,
  less: string,
  extra: Partial<ExternalMetric> = {},
): ExternalMetric => ({
  key,
  label,
  group,
  kind: "number",
  unit,
  more,
  less,
  testNextDay: true,
  ...extra,
});

export const HEALTH_METRICS: ExternalMetric[] = [
  n("steps", "Steps", "activity", "steps", "more steps", "fewer steps", {
    mergeInto: "activity.steps",
  }),
  n(
    "activeEnergy",
    "Active energy",
    "activity",
    "kcal",
    "more active energy",
    "less active energy",
  ),
  n(
    "exerciseMinutes",
    "Exercise",
    "activity",
    "min",
    "more exercise",
    "less exercise",
    {
      mergeInto: "activity.exerciseMinutes",
    },
  ),
  n(
    "workouts",
    "Workouts",
    "activity",
    undefined,
    "more workouts",
    "fewer workouts",
  ),
  n(
    "workoutMinutes",
    "Workout time",
    "activity",
    "min",
    "longer workouts",
    "shorter workouts",
  ),
  n("sleepHours", "Sleep", "sleep", "h", "more sleep", "less sleep", {
    mergeInto: "sleep.hours",
    dayPrefix: "after nights with",
    nextPrefix: "the day after nights with",
  }),
  n(
    "timeInBed",
    "Time in bed",
    "sleep",
    "h",
    "more time in bed",
    "less time in bed",
    {
      dayPrefix: "after nights with",
      nextPrefix: "the day after nights with",
    },
  ),
  n(
    "bedtime",
    "Bedtime",
    "sleep",
    "h",
    "a later bedtime",
    "an earlier bedtime",
    {
      dayPrefix: "after nights with",
      nextPrefix: "the day after nights with",
    },
  ),
  n(
    "wakeTime",
    "Wake-up time",
    "sleep",
    "h",
    "a later wake-up",
    "an earlier wake-up",
    { dayPrefix: "on days with" },
  ),
  n(
    "deepShare",
    "Deep sleep share",
    "sleep",
    "%",
    "more deep sleep",
    "less deep sleep",
    {
      dayPrefix: "after nights with",
      nextPrefix: "the day after nights with",
    },
  ),
  n(
    "remShare",
    "REM sleep share",
    "sleep",
    "%",
    "more REM sleep",
    "less REM sleep",
    {
      dayPrefix: "after nights with",
      nextPrefix: "the day after nights with",
    },
  ),
  n(
    "restingHr",
    "Resting heart rate",
    "body",
    "bpm",
    "a higher resting heart rate",
    "a lower resting heart rate",
  ),
  n(
    "avgHr",
    "Average heart rate",
    "body",
    "bpm",
    "a higher average heart rate",
    "a lower average heart rate",
  ),
  n(
    "hrv",
    "Heart rate variability",
    "body",
    "ms",
    "higher heart rate variability",
    "lower heart rate variability",
  ),
  n(
    "respiratoryRate",
    "Breathing rate",
    "body",
    "/min",
    "a faster breathing rate",
    "a slower breathing rate",
  ),
  n(
    "spo2",
    "Blood oxygen",
    "body",
    "%",
    "higher blood oxygen",
    "lower blood oxygen",
  ),
  n("weight", "Weight", "body", "kg", "a higher weight", "a lower weight", {
    testNextDay: false,
  }),
  n(
    "bodyTemp",
    "Body temperature",
    "body",
    "°C",
    "a higher body temperature",
    "a lower body temperature",
  ),
  n(
    "basalTemp",
    "Basal temperature",
    "body",
    "°C",
    "a higher basal temperature",
    "a lower basal temperature",
  ),
  n(
    "menstruationFlow",
    "Period flow",
    "cycle",
    undefined,
    "heavier flow",
    "lighter flow",
  ),
  n(
    "ovulationTest",
    "Ovulation test",
    "cycle",
    undefined,
    "a positive ovulation test",
    "a negative ovulation test",
  ),
  n(
    "cervicalMucus",
    "Cervical mucus",
    "cycle",
    undefined,
    "more fertile-type mucus",
    "less fertile-type mucus",
  ),
  n("water", "Water (health app)", "food", "ml", "more water", "less water"),
  n(
    "caffeineMg",
    "Caffeine (health app)",
    "substances",
    "mg",
    "more caffeine",
    "less caffeine",
  ),
  n(
    "dietaryEnergy",
    "Calories eaten",
    "food",
    "kcal",
    "more calories",
    "fewer calories",
  ),
  n(
    "mindfulMinutes",
    "Mindfulness",
    "activity",
    "min",
    "more mindfulness",
    "less mindfulness",
  ),
];

const HEALTH_FAMILIES: Record<string, string> = {
  timeInBed: "sleep",
  bedtime: "sleepTiming",
  wakeTime: "sleepTiming",
  deepShare: "sleepStages",
  remShare: "sleepStages",
  restingHr: "heart",
  avgHr: "heart",
  bodyTemp: "temperature",
  basalTemp: "temperature",
  workouts: "workouts",
  workoutMinutes: "workouts",
};

for (const metric of HEALTH_METRICS)
  metric.family = HEALTH_FAMILIES[metric.key];

export const PHONE_STEP_METRIC: ExternalMetric = n(
  "steps",
  "Steps",
  "activity",
  "steps",
  "more steps",
  "fewer steps",
  {
    mergeInto: "activity.steps",
  },
);

export function metricsForTypes(
  types: readonly HealthDataType[],
): ExternalMetric[] {
  const keys = new Set(
    HEALTH_TYPES.filter((t) => types.includes(t.id)).flatMap((t) => t.metrics),
  );
  return HEALTH_METRICS.filter((m) => keys.has(m.key));
}

/** Hours relative to midnight, with evening times negative (11pm → -1, 1am → 1). */
export function bedtimeHours(date: Date): number {
  const h = date.getHours() + date.getMinutes() / 60;
  return h >= 12 ? h - 24 : h;
}
