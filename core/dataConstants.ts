import type { InsightSettings, IntakeConfig } from "@/core/DataContext";

/** IDs of the six sample entries older versions seeded into new installs. */
export const SAMPLE_ENTRY_IDS = new Set(["1", "2", "3", "4", "5", "6"]);

export const DEFAULT_INSIGHT_SETTINGS: InsightSettings = {
  showNumbers: false,
  outlookNotifications: false,
  medNudges: false,
  lowEffortCheckins: false,
  medSlipHeadsUp: false,
  weatherEnabled: false,
  weatherMode: "gps",
  homeTown: null,
  stepsEnabled: false,
  substancesEnabled: false,
};

export const DEFAULT_INTAKE_CONFIG: IntakeConfig = {
  tags: [
    "High sugar",
    "Fast / processed",
    "Fruit & veg",
    "Protein",
    "Dairy",
    "Gluten",
    "Spicy",
    "Big meal",
  ],
  hiddenTags: [],
  substances: [
    {
      id: "caffeine",
      name: "Caffeine",
      unit: "cups",
      stimulant: true,
      enabled: true,
    },
    { id: "alcohol", name: "Alcohol", unit: "units", enabled: true },
    {
      id: "nicotine",
      name: "Nicotine",
      unit: "times",
      stimulant: true,
      enabled: true,
    },
    { id: "cannabis", name: "Cannabis", unit: "times", enabled: true },
  ],
};
