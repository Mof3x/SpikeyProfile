import type { DayKey } from "@/core/analytics/dates";
import type { ExternalMetric } from "@/core/analytics/types";

const w = (
  key: string,
  label: string,
  unit: string | undefined,
  more: string,
  less: string,
  extra: Partial<ExternalMetric> = {},
): ExternalMetric => ({
  key,
  label,
  group: "weather",
  kind: "number",
  unit,
  more,
  less,
  knownInAdvance: true,
  ...extra,
});

const flag = (
  key: string,
  label: string,
  onDays: string,
  dayAfter: string,
  extra: Partial<ExternalMetric> = {},
): ExternalMetric => ({
  key,
  label,
  group: "weather",
  kind: "yesno",
  onDays,
  dayAfter,
  knownInAdvance: true,
  ...extra,
});

const FAMILIES: Record<string, string[]> = {
  temperature: [
    "tempMax",
    "tempMin",
    "tempMean",
    "feelsLikeMax",
    "feelsLikeMin",
    "hotDay",
    "coldDay",
  ],
  tempChange: ["tempSwing", "tempChange"],
  humidity: ["humidity", "dewPoint", "muggy"],
  pressure: ["pressure", "pressureChange", "pressureDrop"],
  rain: ["rain", "rainHours", "snow"],
  wind: ["windMax", "gustMax"],
  light: ["sunshine", "cloud", "uvMax"],
  daylight: ["daylight"],
  air: ["aqi", "pm25", "pm10", "ozone", "no2"],
};

const familyOf = (key: string) =>
  Object.entries(FAMILIES).find(([, keys]) => keys.includes(key))?.[0] ??
  (key.endsWith("Pollen") ? key : undefined);

const BASE_METRICS: ExternalMetric[] = [
  w("tempMax", "Max temperature", "°C", "warmer weather", "cooler weather"),
  w("tempMin", "Overnight low", "°C", "warmer nights", "colder nights"),
  w(
    "tempMean",
    "Average temperature",
    "°C",
    "warmer weather",
    "cooler weather",
  ),
  w(
    "feelsLikeMax",
    "Feels-like high",
    "°C",
    "hotter-feeling weather",
    "colder-feeling weather",
  ),
  w(
    "feelsLikeMin",
    "Feels-like low",
    "°C",
    "milder-feeling nights",
    "colder-feeling nights",
  ),
  w(
    "tempSwing",
    "Temperature swing",
    "°C",
    "bigger temperature swings",
    "steadier temperatures",
  ),
  w(
    "tempChange",
    "Temperature change",
    "°C",
    "warmer-than-yesterday weather",
    "colder-than-yesterday weather",
    {
      testNextDay: true,
    },
  ),
  flag("hotDay", "Hot day", "on hot days", "the day after a hot day", {
    testNextDay: true,
  }),
  flag("coldDay", "Cold day", "on cold days", "the day after a cold day"),
  w("humidity", "Humidity", "%", "higher humidity", "lower humidity"),
  w("dewPoint", "Dew point", "°C", "muggier air", "drier air"),
  flag("muggy", "Muggy day", "on muggy days", "the day after a muggy day"),
  w(
    "pressure",
    "Air pressure",
    "hPa",
    "higher air pressure",
    "lower air pressure",
  ),
  w(
    "pressureChange",
    "Pressure change",
    "hPa",
    "rising air pressure",
    "falling air pressure",
    { testNextDay: true },
  ),
  flag(
    "pressureDrop",
    "Big pressure drop",
    "on days with a big pressure drop",
    "the day after a big pressure drop",
    {
      testNextDay: true,
    },
  ),
  w("rain", "Rain", "mm", "more rain", "less rain"),
  w(
    "rainHours",
    "Hours of rain",
    "h",
    "more hours of rain",
    "fewer hours of rain",
  ),
  w("snow", "Snowfall", "cm", "more snow", "less snow"),
  w("windMax", "Wind", "km/h", "windier weather", "calmer weather"),
  w("gustMax", "Wind gusts", "km/h", "stronger gusts", "lighter gusts"),
  w("sunshine", "Sunshine", "h", "more sunshine", "less sunshine"),
  w("daylight", "Daylight", "h", "longer days", "shorter days"),
  w("cloud", "Cloud cover", "%", "cloudier skies", "clearer skies"),
  w("uvMax", "UV index", undefined, "stronger sun", "weaker sun"),
  w("aqi", "Air quality index", undefined, "worse air quality", "cleaner air"),
  w(
    "pm25",
    "PM2.5 pollution",
    "µg/m³",
    "more fine-particle pollution",
    "less fine-particle pollution",
  ),
  w(
    "pm10",
    "PM10 pollution",
    "µg/m³",
    "more particle pollution",
    "less particle pollution",
  ),
  w("ozone", "Ozone", "µg/m³", "more ozone", "less ozone"),
  w(
    "no2",
    "Nitrogen dioxide",
    "µg/m³",
    "more traffic pollution",
    "less traffic pollution",
  ),
  w(
    "grassPollen",
    "Grass pollen",
    undefined,
    "more grass pollen",
    "less grass pollen",
  ),
  w(
    "birchPollen",
    "Birch pollen",
    undefined,
    "more birch pollen",
    "less birch pollen",
  ),
  w(
    "alderPollen",
    "Alder pollen",
    undefined,
    "more alder pollen",
    "less alder pollen",
  ),
  w(
    "mugwortPollen",
    "Mugwort pollen",
    undefined,
    "more mugwort pollen",
    "less mugwort pollen",
  ),
  w(
    "ragweedPollen",
    "Ragweed pollen",
    undefined,
    "more ragweed pollen",
    "less ragweed pollen",
  ),
  w(
    "olivePollen",
    "Olive pollen",
    undefined,
    "more olive pollen",
    "less olive pollen",
  ),
];

export const WEATHER_METRICS: ExternalMetric[] = BASE_METRICS.map((m) => ({
  ...m,
  family: familyOf(m.key),
}));

export const FORECAST_DAILY = [
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "precipitation_hours",
  "snowfall_sum",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "sunshine_duration",
  "daylight_duration",
  "uv_index_max",
];

export const FORECAST_HOURLY = [
  "temperature_2m",
  "relative_humidity_2m",
  "dew_point_2m",
  "pressure_msl",
  "cloud_cover",
];

export const AIR_HOURLY = [
  "european_aqi",
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "grass_pollen",
  "birch_pollen",
  "alder_pollen",
  "mugwort_pollen",
  "ragweed_pollen",
  "olive_pollen",
];

type Series = Record<string, (number | null)[] | string[] | undefined>;

interface OpenMeteoResponse {
  daily?: Series & { time?: string[] };
  hourly?: Series & { time?: string[] };
}

function dailyFromHourly(
  hourly: OpenMeteoResponse["hourly"],
  field: string,
  reduce: "mean" | "max",
): Map<DayKey, number> {
  const out = new Map<DayKey, number>();
  const times = hourly?.time;
  const values = hourly?.[field] as (number | null)[] | undefined;
  if (!times || !values) return out;
  const acc = new Map<DayKey, number[]>();
  times.forEach((t, i) => {
    const v = values[i];
    if (v === null || v === undefined || !Number.isFinite(v)) return;
    const day = t.slice(0, 10);
    acc.set(day, [...(acc.get(day) ?? []), v]);
  });
  for (const [day, vals] of acc) {
    out.set(
      day,
      reduce === "max"
        ? Math.max(...vals)
        : vals.reduce((a, b) => a + b, 0) / vals.length,
    );
  }
  return out;
}

const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** Turn Open-Meteo forecast (+ optional air-quality) responses into one row of weather factors per day. */
export function parseOpenMeteo(
  forecast: OpenMeteoResponse,
  air?: OpenMeteoResponse,
): Record<DayKey, Record<string, number>> {
  const days: Record<DayKey, Record<string, number>> = {};
  const set = (day: DayKey, key: string, value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(value))
      return;
    (days[day] ??= {})[key] = round(value);
  };

  const daily = forecast.daily;
  const times = daily?.time ?? [];
  const col = (name: string) =>
    (daily?.[name] as (number | null)[] | undefined) ?? [];
  times.forEach((day, i) => {
    set(day, "tempMax", col("temperature_2m_max")[i]);
    set(day, "tempMin", col("temperature_2m_min")[i]);
    set(day, "feelsLikeMax", col("apparent_temperature_max")[i]);
    set(day, "feelsLikeMin", col("apparent_temperature_min")[i]);
    set(day, "rain", col("precipitation_sum")[i]);
    set(day, "rainHours", col("precipitation_hours")[i]);
    set(day, "snow", col("snowfall_sum")[i]);
    set(day, "windMax", col("wind_speed_10m_max")[i]);
    set(day, "gustMax", col("wind_gusts_10m_max")[i]);
    const sun = col("sunshine_duration")[i];
    if (sun !== null && sun !== undefined) set(day, "sunshine", sun / 3600);
    const light = col("daylight_duration")[i];
    if (light !== null && light !== undefined)
      set(day, "daylight", light / 3600);
    set(day, "uvMax", col("uv_index_max")[i]);
  });

  const hourlyMeans: [string, string, "mean" | "max"][] = [
    ["temperature_2m", "tempMean", "mean"],
    ["relative_humidity_2m", "humidity", "mean"],
    ["dew_point_2m", "dewPoint", "mean"],
    ["pressure_msl", "pressure", "mean"],
    ["cloud_cover", "cloud", "mean"],
  ];
  for (const [field, key, reduce] of hourlyMeans) {
    for (const [day, v] of dailyFromHourly(forecast.hourly, field, reduce))
      set(day, key, v);
  }

  if (air) {
    const airFields: [string, string, "mean" | "max"][] = [
      ["european_aqi", "aqi", "mean"],
      ["pm2_5", "pm25", "mean"],
      ["pm10", "pm10", "mean"],
      ["ozone", "ozone", "mean"],
      ["nitrogen_dioxide", "no2", "mean"],
      ["grass_pollen", "grassPollen", "max"],
      ["birch_pollen", "birchPollen", "max"],
      ["alder_pollen", "alderPollen", "max"],
      ["mugwort_pollen", "mugwortPollen", "max"],
      ["ragweed_pollen", "ragweedPollen", "max"],
      ["olive_pollen", "olivePollen", "max"],
    ];
    for (const [field, key, reduce] of airFields) {
      for (const [day, v] of dailyFromHourly(air.hourly, field, reduce))
        set(day, key, v);
    }
  }

  return withDerivedWeather(days);
}

/** Adds swing, day-to-day changes and the yes/no flags from the raw daily values. */
export function withDerivedWeather(
  days: Record<DayKey, Record<string, number>>,
): Record<DayKey, Record<string, number>> {
  const sorted = Object.keys(days).sort();
  let prev: Record<string, number> | undefined;
  for (const day of sorted) {
    const d = days[day];
    if (d.tempMax !== undefined && d.tempMin !== undefined)
      d.tempSwing = round(d.tempMax - d.tempMin);
    if (d.feelsLikeMax !== undefined) {
      d.hotDay = d.feelsLikeMax >= 25 ? 1 : 0;
      d.coldDay = d.feelsLikeMax <= 3 ? 1 : 0;
    }
    if (d.dewPoint !== undefined) d.muggy = d.dewPoint >= 16 ? 1 : 0;
    if (prev?.tempMax !== undefined && d.tempMax !== undefined)
      d.tempChange = round(d.tempMax - prev.tempMax);
    if (prev?.pressure !== undefined && d.pressure !== undefined) {
      d.pressureChange = round(d.pressure - prev.pressure);
      d.pressureDrop = d.pressureChange <= -5 ? 1 : 0;
    }
    prev = d;
  }
  return days;
}

/** Round to one decimal place (about 10 km) so an exact location never leaves the phone. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 10) / 10;
}
