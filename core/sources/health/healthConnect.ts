import { Platform } from "react-native";

import { dayKey } from "@/core/analytics/dates";
import type { HealthDataType } from "../healthMetrics";
import { addSleep, DailyAccumulator, type SleepSegment } from "./aggregate";
import type { HealthSource } from "./types";

/* eslint-disable @typescript-eslint/no-require-imports */

// Health Connect is Android's health hub; Samsung Health, Fitbit, Garmin, Oura and others share into it.
let cached: any | null | undefined;
function healthConnect(): any | null {
  if (cached !== undefined) return cached;
  if (Platform.OS !== "android") return (cached = null);
  try {
    cached = require("react-native-health-connect");
  } catch {
    cached = null;
  }
  return cached;
}

const RECORDS: Record<HealthDataType, string[]> = {
  steps: ["Steps"],
  activeEnergy: ["ActiveCaloriesBurned"],
  exercise: ["ExerciseSession"],
  workouts: ["ExerciseSession"],
  sleep: ["SleepSession"],
  heart: ["RestingHeartRate", "HeartRate"],
  hrv: ["HeartRateVariabilityRmssd"],
  respiratory: ["RespiratoryRate"],
  oxygen: ["OxygenSaturation"],
  weight: ["Weight"],
  temperature: ["BodyTemperature", "BasalBodyTemperature"],
  cycle: [
    "MenstruationFlow",
    "MenstruationPeriod",
    "OvulationTest",
    "CervicalMucus",
  ],
  water: ["Hydration"],
  caffeine: ["Nutrition"],
  nutrition: ["Nutrition"],
  mindfulness: ["MindfulnessSession"],
};

// Health Connect sleep stages: 1 awake, 2 sleeping, 3 out of bed, 4 light, 5 deep, 6 REM.
const SLEEP_STAGES: Record<number, SleepSegment["stage"]> = {
  1: "awake",
  2: "asleep",
  3: "awake",
  4: "light",
  5: "deep",
  6: "rem",
};

function recordTypes(types: readonly HealthDataType[]): string[] {
  return [...new Set(types.flatMap((t) => RECORDS[t] ?? []))];
}

async function readAll(
  hc: any,
  recordType: string,
  from: Date,
  to: Date,
): Promise<any[]> {
  const records: any[] = [];
  let pageToken: string | undefined;
  let guard = 0;
  do {
    const result = await hc.readRecords(recordType, {
      timeRangeFilter: {
        operator: "between",
        startTime: from.toISOString(),
        endTime: to.toISOString(),
      },
      pageSize: 1000,
      pageToken,
    });
    records.push(...(result?.records ?? []));
    pageToken = result?.pageToken || undefined;
    guard++;
  } while (pageToken && guard < 50);
  return records;
}

const minutesBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 60000;

export const healthConnectSource: HealthSource = {
  id: "healthConnect",
  label: "Health Connect (Samsung Health and others)",

  async isAvailable() {
    const hc = healthConnect();
    if (!hc) return false;
    try {
      const status = await hc.getSdkStatus();
      if (status !== hc.SdkAvailabilityStatus?.SDK_AVAILABLE && status !== 3)
        return false;
      return Boolean(await hc.initialize());
    } catch {
      return false;
    }
  },

  async requestPermissions(types) {
    const hc = healthConnect();
    if (!hc) return false;
    try {
      await hc.initialize();
      const wanted = recordTypes(types).map((recordType) => ({
        accessType: "read",
        recordType,
      }));
      // Lets the app read beyond the default 30 days before permission was given (Android 14+).
      const granted = await hc.requestPermission([
        ...wanted,
        { accessType: "read", recordType: "ReadHealthDataHistory" },
      ]);
      return Array.isArray(granted) && granted.length > 0;
    } catch {
      return false;
    }
  },

  openSettings() {
    try {
      healthConnect()?.openHealthConnectSettings();
    } catch {
      // Nothing to open.
    }
  },

  async readDaily(types, from, to) {
    const hc = healthConnect();
    const acc = new DailyAccumulator();
    if (!hc) return acc.result();
    const read = async (recordType: string) => {
      try {
        return await readAll(hc, recordType, from, to);
      } catch {
        return [];
      }
    };
    const want = new Set(types);

    if (want.has("steps")) {
      for (const r of await read("Steps"))
        acc.add(dayKey(new Date(r.startTime)), "steps", r.count, "sum");
    }
    if (want.has("activeEnergy")) {
      for (const r of await read("ActiveCaloriesBurned")) {
        acc.add(
          dayKey(new Date(r.startTime)),
          "activeEnergy",
          r.energy?.inKilocalories ?? 0,
          "sum",
        );
      }
    }
    if (want.has("exercise") || want.has("workouts")) {
      for (const r of await read("ExerciseSession")) {
        const day = dayKey(new Date(r.startTime));
        const minutes = minutesBetween(r.startTime, r.endTime);
        if (want.has("exercise"))
          acc.add(day, "exerciseMinutes", minutes, "sum");
        if (want.has("workouts")) {
          acc.add(day, "workouts", 1, "sum");
          acc.add(day, "workoutMinutes", minutes, "sum");
        }
      }
    }
    if (want.has("sleep")) {
      const segments: SleepSegment[] = [];
      for (const s of await read("SleepSession")) {
        if (Array.isArray(s.stages) && s.stages.length) {
          for (const st of s.stages) {
            segments.push({
              start: new Date(st.startTime),
              end: new Date(st.endTime),
              stage: SLEEP_STAGES[st.stage] ?? "asleep",
            });
          }
        } else {
          segments.push({
            start: new Date(s.startTime),
            end: new Date(s.endTime),
            stage: "asleep",
          });
        }
      }
      addSleep(acc, segments);
    }
    if (want.has("heart")) {
      for (const r of await read("RestingHeartRate"))
        acc.add(
          dayKey(new Date(r.time)),
          "restingHr",
          r.beatsPerMinute,
          "mean",
        );
      for (const r of await read("HeartRate")) {
        for (const s of r.samples ?? [])
          acc.add(dayKey(new Date(s.time)), "avgHr", s.beatsPerMinute, "mean");
      }
    }
    if (want.has("hrv")) {
      for (const r of await read("HeartRateVariabilityRmssd")) {
        acc.add(
          dayKey(new Date(r.time)),
          "hrv",
          r.heartRateVariabilityMillis,
          "mean",
        );
      }
    }
    if (want.has("respiratory")) {
      for (const r of await read("RespiratoryRate"))
        acc.add(dayKey(new Date(r.time)), "respiratoryRate", r.rate, "mean");
    }
    if (want.has("oxygen")) {
      for (const r of await read("OxygenSaturation"))
        acc.add(dayKey(new Date(r.time)), "spo2", r.percentage, "mean");
    }
    if (want.has("weight")) {
      for (const r of await read("Weight"))
        acc.add(
          dayKey(new Date(r.time)),
          "weight",
          r.weight?.inKilograms,
          "mean",
        );
    }
    if (want.has("temperature")) {
      for (const r of await read("BodyTemperature"))
        acc.add(
          dayKey(new Date(r.time)),
          "bodyTemp",
          r.temperature?.inCelsius,
          "mean",
        );
      for (const r of await read("BasalBodyTemperature")) {
        acc.add(
          dayKey(new Date(r.time)),
          "basalTemp",
          r.temperature?.inCelsius,
          "mean",
        );
      }
    }
    if (want.has("cycle")) {
      // Flow: 0 unknown, 1 light, 2 medium, 3 heavy.
      for (const r of await read("MenstruationFlow")) {
        acc.add(
          dayKey(new Date(r.time)),
          "menstruationFlow",
          r.flow ? r.flow : 2,
          "max",
        );
      }
      for (const r of await read("MenstruationPeriod")) {
        const day = new Date(r.startTime);
        const end = new Date(r.endTime);
        let guard = 0;
        while (day < end && guard < 15) {
          acc.add(dayKey(day), "menstruationFlow", 2, "max");
          day.setDate(day.getDate() + 1);
          guard++;
        }
      }
      // Result: 1 positive, 2 high, 3 negative, 4 inconclusive.
      for (const r of await read("OvulationTest")) {
        acc.add(
          dayKey(new Date(r.time)),
          "ovulationTest",
          r.result === 1 || r.result === 2 ? 1 : 0,
          "max",
        );
      }
      for (const r of await read("CervicalMucus")) {
        if (r.appearance)
          acc.add(
            dayKey(new Date(r.time)),
            "cervicalMucus",
            r.appearance,
            "max",
          );
      }
    }
    if (want.has("water")) {
      for (const r of await read("Hydration"))
        acc.add(
          dayKey(new Date(r.startTime)),
          "water",
          r.volume?.inMilliliters ?? 0,
          "sum",
        );
    }
    if (want.has("caffeine") || want.has("nutrition")) {
      for (const r of await read("Nutrition")) {
        const day = dayKey(new Date(r.startTime));
        if (want.has("caffeine") && r.caffeine?.inGrams)
          acc.add(day, "caffeineMg", r.caffeine.inGrams * 1000, "sum");
        if (want.has("nutrition") && r.energy?.inKilocalories)
          acc.add(day, "dietaryEnergy", r.energy.inKilocalories, "sum");
      }
    }
    if (want.has("mindfulness")) {
      for (const r of await read("MindfulnessSession")) {
        acc.add(
          dayKey(new Date(r.startTime)),
          "mindfulMinutes",
          minutesBetween(r.startTime, r.endTime),
          "sum",
        );
      }
    }
    return acc.result();
  },
};
