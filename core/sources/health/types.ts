import type { HealthDataType } from "../healthMetrics";
import type { DailyValues } from "./aggregate";

export type HealthProviderId = "appleHealth" | "healthConnect";

export interface HealthSource {
  id: HealthProviderId;
  label: string;
  /** False in Expo Go, on web, or when the health app isn't installed/supported. */
  isAvailable: () => Promise<boolean>;
  requestPermissions: (types: readonly HealthDataType[]) => Promise<boolean>;
  readDaily: (
    types: readonly HealthDataType[],
    from: Date,
    to: Date,
  ) => Promise<DailyValues>;
  /** Android: opens Health Connect so the person can turn on sharing from Samsung Health. */
  openSettings?: () => void;
}
