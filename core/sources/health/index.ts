import { Platform } from "react-native";

import { appleHealth } from "./appleHealth";
import { healthConnectSource } from "./healthConnect";
import type { HealthSource } from "./types";

export function getHealthSource(): HealthSource | null {
  if (Platform.OS === "ios") return appleHealth;
  if (Platform.OS === "android") return healthConnectSource;
  return null;
}

export type { HealthSource, HealthProviderId } from "./types";
export { mergeDailyValues, type DailyValues } from "./aggregate";
