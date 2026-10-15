import { Platform } from "react-native";

import { dayKey } from "@/core/analytics/dates";
import type { HealthDataType } from "../healthMetrics";
import { addSleep, DailyAccumulator, type SleepSegment } from "./aggregate";
import type { HealthSource } from "./types";

/* eslint-disable @typescript-eslint/no-require-imports */

// Loaded lazily: the native module only exists in a development/production build, not in Expo Go.
let cached: any | null | undefined;
function healthKit(): any | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== "ios") return (cached = null);
  try {
    cached = require("@kingstinct/react-native-healthkit");
  } catch {
    cached = null;
  }
  return cached;
}

type QuantitySpec = {
  id: string;
  unit: string;
  metric: string;
  stat: "cumulativeSum" | "discreteAverage";
};

const QUANTITIES: Partial<Record<HealthDataType, QuantitySpec[]>> = {
  steps: [
    {
      id: "HKQuantityTypeIdentifierStepCount",
      unit: "count",
      metric: "steps",
      stat: "cumulativeSum",
    },
  ],
  activeEnergy: [
    {
      id: "HKQuantityTypeIdentifierActiveEnergyBurned",
      unit: "kcal",
      metric: "activeEnergy",
      stat: "cumulativeSum",
    },
  ],
  exercise: [
    {
      id: "HKQuantityTypeIdentifierAppleExerciseTime",
      unit: "min",
      metric: "exerciseMinutes",
      stat: "cumulativeSum",
    },
  ],
  heart: [
    {
      id: "HKQuantityTypeIdentifierRestingHeartRate",
      unit: "count/min",
      metric: "restingHr",
      stat: "discreteAverage",
    },
    {
      id: "HKQuantityTypeIdentifierHeartRate",
      unit: "count/min",
      metric: "avgHr",
      stat: "discreteAverage",
    },
  ],
  hrv: [
    {
      id: "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
      unit: "ms",
      metric: "hrv",
      stat: "discreteAverage",
    },
  ],
  respiratory: [
    {
      id: "HKQuantityTypeIdentifierRespiratoryRate",
      unit: "count/min",
      metric: "respiratoryRate",
      stat: "discreteAverage",
    },
  ],
  oxygen: [
    {
      id: "HKQuantityTypeIdentifierOxygenSaturation",
      unit: "%",
      metric: "spo2",
      stat: "discreteAverage",
    },
  ],
  weight: [
    {
      id: "HKQuantityTypeIdentifierBodyMass",
      unit: "kg",
      metric: "weight",
      stat: "discreteAverage",
    },
  ],
  temperature: [
    {
      id: "HKQuantityTypeIdentifierBodyTemperature",
      unit: "degC",
      metric: "bodyTemp",
      stat: "discreteAverage",
    },
    {
      id: "HKQuantityTypeIdentifierBasalBodyTemperature",
      unit: "degC",
      metric: "basalTemp",
      stat: "discreteAverage",
    },
  ],
  water: [
    {
      id: "HKQuantityTypeIdentifierDietaryWater",
      unit: "mL",
      metric: "water",
      stat: "cumulativeSum",
    },
  ],
  caffeine: [
    {
      id: "HKQuantityTypeIdentifierDietaryCaffeine",
      unit: "mg",
      metric: "caffeineMg",
      stat: "cumulativeSum",
    },
  ],
  nutrition: [
    {
      id: "HKQuantityTypeIdentifierDietaryEnergyConsumed",
      unit: "kcal",
      metric: "dietaryEnergy",
      stat: "cumulativeSum",
    },
  ],
};

const CATEGORIES: Partial<Record<HealthDataType, string[]>> = {
  sleep: ["HKCategoryTypeIdentifierSleepAnalysis"],
  cycle: [
    "HKCategoryTypeIdentifierMenstrualFlow",
    "HKCategoryTypeIdentifierOvulationTestResult",
    "HKCategoryTypeIdentifierCervicalMucusQuality",
  ],
  mindfulness: ["HKCategoryTypeIdentifierMindfulSession"],
};

const SLEEP_STAGES: Record<number, SleepSegment["stage"]> = {
  0: "inBed",
  1: "asleep",
  2: "awake",
  3: "light",
  4: "deep",
  5: "rem",
};

function readTypes(types: readonly HealthDataType[]): string[] {
  const ids: string[] = [];
  for (const t of types) {
    (QUANTITIES[t] ?? []).forEach((q) => ids.push(q.id));
    (CATEGORIES[t] ?? []).forEach((c) => ids.push(c));
    if (t === "workouts") ids.push("HKWorkoutTypeIdentifier");
  }
  return ids;
}

const midnight = (d: Date) => {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  return m;
};

export const appleHealth: HealthSource = {
  id: "appleHealth",
  label: "Apple Health",

  async isAvailable() {
    const hk = healthKit();
    if (!hk) return false;
    try {
      return Boolean(await hk.isHealthDataAvailableAsync());
    } catch {
      return false;
    }
  },

  async requestPermissions(types) {
    const hk = healthKit();
    if (!hk) return false;
    try {
      return Boolean(
        await hk.requestAuthorization({ toRead: readTypes(types) }),
      );
    } catch {
      return false;
    }
  },

  async readDaily(types, from, to) {
    const hk = healthKit();
    const acc = new DailyAccumulator();
    if (!hk) return acc.result();
    const filter = { date: { startDate: from, endDate: to } };

    for (const t of types) {
      for (const q of QUANTITIES[t] ?? []) {
        try {
          const buckets = await hk.queryStatisticsCollectionForQuantity(
            q.id,
            [q.stat],
            midnight(from),
            { day: 1 },
            {
              filter,
              unit: q.unit,
            },
          );
          for (const b of buckets ?? []) {
            const quantity =
              q.stat === "cumulativeSum"
                ? b.sumQuantity?.quantity
                : b.averageQuantity?.quantity;
            if (quantity === undefined || !b.startDate) continue;
            if (q.stat === "cumulativeSum" && quantity === 0) continue;
            acc.add(dayKey(new Date(b.startDate)), q.metric, quantity, "max");
          }
        } catch {
          // A type the person didn't grant (or the device doesn't record) is simply skipped.
        }
      }
    }

    const categories = async (id: string) => {
      try {
        return (await hk.queryCategorySamples(id, { limit: 0, filter })) ?? [];
      } catch {
        return [];
      }
    };

    if (types.includes("sleep")) {
      const samples = await categories("HKCategoryTypeIdentifierSleepAnalysis");
      addSleep(
        acc,
        samples.map((s: any) => ({
          start: new Date(s.startDate),
          end: new Date(s.endDate),
          stage: SLEEP_STAGES[s.value] ?? "asleep",
        })),
      );
    }

    if (types.includes("cycle")) {
      for (const s of await categories(
        "HKCategoryTypeIdentifierMenstrualFlow",
      )) {
        // 1 unspecified, 2 light, 3 medium, 4 heavy, 5 none.
        if (s.value >= 1 && s.value <= 4) {
          acc.add(
            dayKey(new Date(s.startDate)),
            "menstruationFlow",
            s.value === 1 ? 2 : s.value - 1,
            "max",
          );
        }
      }
      for (const s of await categories(
        "HKCategoryTypeIdentifierOvulationTestResult",
      )) {
        acc.add(
          dayKey(new Date(s.startDate)),
          "ovulationTest",
          s.value === 2 ? 1 : 0,
          "max",
        );
      }
      for (const s of await categories(
        "HKCategoryTypeIdentifierCervicalMucusQuality",
      )) {
        acc.add(dayKey(new Date(s.startDate)), "cervicalMucus", s.value, "max");
      }
    }

    if (types.includes("mindfulness")) {
      for (const s of await categories(
        "HKCategoryTypeIdentifierMindfulSession",
      )) {
        const minutes =
          (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) /
          60000;
        acc.add(
          dayKey(new Date(s.startDate)),
          "mindfulMinutes",
          minutes,
          "sum",
        );
      }
    }

    if (types.includes("workouts")) {
      try {
        const workouts =
          (await hk.queryWorkoutSamples({ limit: 0, filter })) ?? [];
        for (const w of workouts) {
          const start = new Date(w.startDate);
          const minutes =
            (new Date(w.endDate).getTime() - start.getTime()) / 60000;
          acc.add(dayKey(start), "workouts", 1, "sum");
          acc.add(dayKey(start), "workoutMinutes", minutes, "sum");
        }
      } catch {
        // Skipped when not granted.
      }
    }

    return acc.result();
  },
};
