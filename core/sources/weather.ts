import * as Location from "expo-location";

import { addDays, dayKey, type DayKey } from "@/core/analytics/dates";
import type { HomeTown } from "@/core/DataContext";
import {
  AIR_HOURLY,
  FORECAST_DAILY,
  FORECAST_HOURLY,
  parseOpenMeteo,
  roundCoordinate,
  withDerivedWeather,
} from "./weatherMetrics";

export interface WeatherCache {
  days: Record<DayKey, Record<string, number>>;
  fetchedOn: DayKey | null;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

export const EMPTY_WEATHER: WeatherCache = { days: {}, fetchedOn: null };

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const RECENT_DAYS = 92;
const MAX_HISTORY_DAYS = 365;

/** Approximate position (rounded to ~10 km). Returns null if permission is refused. */
export async function approximateLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const last = await Location.getLastKnownPositionAsync();
  const position =
    last ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Lowest,
    }));
  return {
    latitude: roundCoordinate(position.coords.latitude),
    longitude: roundCoordinate(position.coords.longitude),
  };
}

export async function searchTowns(name: string): Promise<HomeTown[]> {
  if (name.trim().length < 2) return [];
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(name.trim())}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results ?? []).map((r: any) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    latitude: roundCoordinate(r.latitude),
    longitude: roundCoordinate(r.longitude),
  }));
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather service replied ${res.status}`);
  return res.json();
}

/**
 * Fetches recent weather (last ~3 months plus tomorrow's forecast) and, if needed, older history
 * back to `oldestNeeded` (capped at a year). Only rounded coordinates are sent.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  oldestNeeded: DayKey | null,
): Promise<Record<DayKey, Record<string, number>>> {
  const lat = roundCoordinate(latitude);
  const lon = roundCoordinate(longitude);
  const base = `latitude=${lat}&longitude=${lon}&timezone=auto`;
  const forecast = await getJson(
    `${FORECAST_URL}?${base}&past_days=${RECENT_DAYS}&forecast_days=2&daily=${FORECAST_DAILY.join(",")}&hourly=${FORECAST_HOURLY.join(",")}`,
  );
  let air: any;
  try {
    air = await getJson(
      `${AIR_URL}?${base}&past_days=${RECENT_DAYS}&forecast_days=2&hourly=${AIR_HOURLY.join(",")}`,
    );
  } catch {
    air = undefined;
  }
  const recent = parseOpenMeteo(forecast, air);

  const today = dayKey(new Date());
  const recentStart = addDays(today, -RECENT_DAYS);
  const cap = addDays(today, -MAX_HISTORY_DAYS);
  if (oldestNeeded && oldestNeeded < recentStart) {
    const start = oldestNeeded < cap ? cap : oldestNeeded;
    try {
      const archive = await getJson(
        `${ARCHIVE_URL}?${base}&start_date=${start}&end_date=${addDays(recentStart, -1)}&daily=${FORECAST_DAILY.filter(
          (d) => d !== "uv_index_max",
        ).join(",")}&hourly=${FORECAST_HOURLY.join(",")}`,
      );
      const older = parseOpenMeteo(archive);
      return withDerivedWeather({ ...older, ...recent });
    } catch {
      return recent;
    }
  }
  return recent;
}
