import { Pedometer } from "expo-sensors";
import { Platform } from "react-native";

import { dayKey, type DayKey } from "@/core/analytics/dates";

/**
 * Phone step counts. iPhones keep about a week of step history that apps can read; most Android
 * phones only report live steps, so on Android steps come through Health Connect instead.
 */
export async function phoneStepsAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function readPhoneSteps(
  days = 7,
): Promise<Record<DayKey, Record<string, number>> | null> {
  if (!(await phoneStepsAvailable())) return null;
  const permission = await Pedometer.requestPermissionsAsync();
  if (!permission.granted) return null;
  const out: Record<DayKey, Record<string, number>> = {};
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const start = new Date(now);
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    try {
      const result = await Pedometer.getStepCountAsync(
        start,
        end < now ? end : now,
      );
      if (result.steps > 0) out[dayKey(start)] = { steps: result.steps };
    } catch {
      // Days beyond the phone's history are skipped.
    }
  }
  return out;
}
