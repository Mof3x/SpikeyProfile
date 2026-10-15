import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { addDays, dayKey, type DayKey } from "@/core/analytics/dates";
import type {
  ExternalMetric,
  ExternalSourceData,
} from "@/core/analytics/types";
import { useData, type HomeTown } from "@/core/DataContext";
import {
  getHealthSource,
  mergeDailyValues,
  type DailyValues,
  type HealthProviderId,
} from "./health";
import {
  metricsForTypes,
  PHONE_STEP_METRIC,
  type HealthDataType,
} from "./healthMetrics";
import { readPhoneSteps, phoneStepsAvailable } from "./steps";
import {
  approximateLocation,
  EMPTY_WEATHER,
  fetchWeather,
  searchTowns,
  type WeatherCache,
} from "./weather";
import { WEATHER_METRICS } from "./weatherMetrics";

export const SOURCE_STORAGE_KEYS = {
  weather: "@spikeyprofile/source/weather",
  steps: "@spikeyprofile/source/steps",
  health: "@spikeyprofile/source/health",
  imports: "@spikeyprofile/source/imports",
};

export interface ImportBatch {
  id: string;
  name: string;
  kind: "samsung" | "csv";
  createdAt: string;
  found?: string[];
  metrics: ExternalMetric[];
  days: DailyValues;
}

interface HealthState {
  provider: HealthProviderId | null;
  types: HealthDataType[];
  lastSync: string | null;
  days: DailyValues;
}

interface StepsState {
  days: DailyValues;
  lastSync: string | null;
}

const EMPTY_HEALTH: HealthState = {
  provider: null,
  types: [],
  lastSync: null,
  days: {},
};
const EMPTY_STEPS: StepsState = { days: {}, lastSync: null };
const HEALTH_RESYNC_MS = 60 * 60 * 1000;

interface SourcesContextValue {
  external: ExternalSourceData[];
  weather: WeatherCache;
  weatherStatus: { loading: boolean; error?: string };
  refreshWeather: (force?: boolean) => Promise<void>;
  findTowns: (name: string) => Promise<HomeTown[]>;
  stepsAvailable: boolean;
  steps: StepsState;
  syncSteps: () => Promise<void>;
  healthAvailable: boolean;
  healthLabel: string;
  health: HealthState;
  healthStatus: { syncing: boolean; error?: string };
  connectHealth: (types: HealthDataType[]) => Promise<boolean>;
  disconnectHealth: () => void;
  syncHealth: (force?: boolean) => Promise<void>;
  openHealthSettings?: () => void;
  imports: ImportBatch[];
  addImport: (batch: Omit<ImportBatch, "id" | "createdAt">) => void;
  removeImport: (id: string) => void;
  /** Development only: show synthetic weather without calling the weather service. */
  loadDemoWeather: (days: DailyValues, town: HomeTown) => void;
}

const SourcesContext = createContext<SourcesContextValue | undefined>(
  undefined,
);

async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function SourcesProvider({ children }: { children: ReactNode }) {
  const {
    insightSettings,
    deviceStorageEnabled,
    dataResetCount,
    symptomEntries,
  } = useData();
  const healthSource = useMemo(() => getHealthSource(), []);

  const [weather, setWeather] = useState<WeatherCache>(EMPTY_WEATHER);
  const [weatherStatus, setWeatherStatus] = useState<{
    loading: boolean;
    error?: string;
  }>({ loading: false });
  const [steps, setSteps] = useState<StepsState>(EMPTY_STEPS);
  const [stepsAvailable, setStepsAvailable] = useState(false);
  const [health, setHealth] = useState<HealthState>(EMPTY_HEALTH);
  const [healthAvailable, setHealthAvailable] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    syncing: boolean;
    error?: string;
  }>({ syncing: false });
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const firstReset = useRef(dataResetCount);

  const persist = useCallback(
    (key: string, value: unknown) => {
      if (!deviceStorageEnabled) return;
      AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
    },
    [deviceStorageEnabled],
  );

  useEffect(() => {
    (async () => {
      const [w, s, h, i] = await Promise.all([
        loadJson(SOURCE_STORAGE_KEYS.weather, EMPTY_WEATHER),
        loadJson(SOURCE_STORAGE_KEYS.steps, EMPTY_STEPS),
        loadJson(SOURCE_STORAGE_KEYS.health, EMPTY_HEALTH),
        loadJson<{ batches: ImportBatch[] }>(SOURCE_STORAGE_KEYS.imports, {
          batches: [],
        }),
      ]);
      setWeather(w);
      setSteps(s);
      setHealth(h);
      setImports(i.batches);
      setLoaded(true);
    })();
    phoneStepsAvailable().then(setStepsAvailable);
    healthSource
      ?.isAvailable()
      .then(setHealthAvailable)
      .catch(() => setHealthAvailable(false));
  }, [healthSource]);

  // "Clear all data" in Settings also clears weather, health and imported data.
  useEffect(() => {
    if (dataResetCount === firstReset.current) return;
    firstReset.current = dataResetCount;
    setWeather(EMPTY_WEATHER);
    setSteps(EMPTY_STEPS);
    setHealth(EMPTY_HEALTH);
    setImports([]);
    AsyncStorage.multiRemove(Object.values(SOURCE_STORAGE_KEYS)).catch(
      () => undefined,
    );
  }, [dataResetCount]);

  const oldestDay = useMemo<DayKey | null>(() => {
    if (symptomEntries.length === 0) return null;
    let min = Infinity;
    for (const e of symptomEntries)
      min = Math.min(min, new Date(e.timestamp).getTime());
    return dayKey(new Date(min));
  }, [symptomEntries]);

  const refreshWeather = useCallback(
    async (force = false) => {
      if (!insightSettings.weatherEnabled) return;
      const today = dayKey(new Date());
      let coords: {
        latitude: number;
        longitude: number;
        placeName?: string;
      } | null = null;
      try {
        setWeatherStatus({ loading: true });
        if (insightSettings.weatherMode === "town") {
          const town = insightSettings.homeTown;
          if (!town) {
            setWeatherStatus({
              loading: false,
              error: "Choose a home town to get weather.",
            });
            return;
          }
          coords = {
            latitude: town.latitude,
            longitude: town.longitude,
            placeName: town.name,
          };
        } else {
          coords = await approximateLocation();
          if (!coords) {
            setWeatherStatus({
              loading: false,
              error:
                "Location permission is off. You can type a home town instead.",
            });
            return;
          }
        }
        const sameSpot =
          weather.latitude === coords.latitude &&
          weather.longitude === coords.longitude;
        if (!force && sameSpot && weather.fetchedOn === today) {
          setWeatherStatus({ loading: false });
          return;
        }
        const days = await fetchWeather(
          coords.latitude,
          coords.longitude,
          oldestDay,
        );
        const next: WeatherCache = {
          days: sameSpot ? { ...weather.days, ...days } : days,
          fetchedOn: today,
          latitude: coords.latitude,
          longitude: coords.longitude,
          placeName: coords.placeName,
        };
        setWeather(next);
        persist(SOURCE_STORAGE_KEYS.weather, next);
        setWeatherStatus({ loading: false });
      } catch {
        setWeatherStatus({
          loading: false,
          error: "Couldn't reach the weather service. It will try again later.",
        });
      }
    },
    [
      insightSettings.weatherEnabled,
      insightSettings.weatherMode,
      insightSettings.homeTown,
      weather,
      oldestDay,
      persist,
    ],
  );

  const syncSteps = useCallback(async () => {
    if (!insightSettings.stepsEnabled) return;
    const days = await readPhoneSteps(7);
    if (!days) return;
    setSteps((prev) => {
      const next = {
        days: { ...prev.days, ...days },
        lastSync: new Date().toISOString(),
      };
      persist(SOURCE_STORAGE_KEYS.steps, next);
      return next;
    });
  }, [insightSettings.stepsEnabled, persist]);

  const syncHealth = useCallback(
    async (force = false) => {
      if (!healthSource || !health.provider || health.types.length === 0)
        return;
      if (
        !force &&
        health.lastSync &&
        Date.now() - new Date(health.lastSync).getTime() < HEALTH_RESYNC_MS
      )
        return;
      setHealthStatus({ syncing: true });
      try {
        const to = new Date();
        const from = health.lastSync
          ? new Date(addDays(dayKey(new Date(health.lastSync)), -2))
          : new Date(addDays(dayKey(to), -365));
        const days = await healthSource.readDaily(health.types, from, to);
        setHealth((prev) => {
          const next = {
            ...prev,
            days: { ...prev.days, ...days },
            lastSync: to.toISOString(),
          };
          persist(SOURCE_STORAGE_KEYS.health, next);
          return next;
        });
        setHealthStatus({ syncing: false });
      } catch {
        setHealthStatus({
          syncing: false,
          error: "Couldn't read from the health app. Check its permissions.",
        });
      }
    },
    [healthSource, health.provider, health.types, health.lastSync, persist],
  );

  const connectHealth = useCallback(
    async (types: HealthDataType[]) => {
      if (!healthSource) return false;
      const ok = await healthSource.requestPermissions(types);
      if (!ok) {
        setHealthStatus({
          syncing: false,
          error: "Permission wasn't given, so nothing will be read.",
        });
        return false;
      }
      const next: HealthState = {
        provider: healthSource.id,
        types,
        lastSync: null,
        days: health.provider ? health.days : {},
      };
      setHealth(next);
      persist(SOURCE_STORAGE_KEYS.health, next);
      setHealthStatus({ syncing: false });
      return true;
    },
    [healthSource, health.provider, health.days, persist],
  );

  const disconnectHealth = useCallback(() => {
    setHealth(EMPTY_HEALTH);
    AsyncStorage.removeItem(SOURCE_STORAGE_KEYS.health).catch(() => undefined);
  }, []);

  const addImport = useCallback(
    (batch: Omit<ImportBatch, "id" | "createdAt">) => {
      setImports((prev) => {
        const next = [
          ...prev,
          {
            ...batch,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
          },
        ];
        persist(SOURCE_STORAGE_KEYS.imports, { batches: next });
        return next;
      });
    },
    [persist],
  );

  const removeImport = useCallback(
    (id: string) => {
      setImports((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persist(SOURCE_STORAGE_KEYS.imports, { batches: next });
        return next;
      });
    },
    [persist],
  );

  const loadDemoWeather = useCallback(
    (days: DailyValues, town: HomeTown) => {
      const next: WeatherCache = {
        days,
        fetchedOn: dayKey(new Date()),
        latitude: town.latitude,
        longitude: town.longitude,
        placeName: town.name,
      };
      setWeather(next);
      persist(SOURCE_STORAGE_KEYS.weather, next);
    },
    [persist],
  );

  // Refresh when the app opens and whenever it comes back to the foreground.
  const refreshAll = useRef<() => void>(() => undefined);
  refreshAll.current = () => {
    refreshWeather(false);
    syncSteps();
    syncHealth(false);
  };
  useEffect(() => {
    if (!loaded) return;
    refreshAll.current();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshAll.current();
    });
    return () => sub.remove();
  }, [
    loaded,
    insightSettings.weatherEnabled,
    insightSettings.weatherMode,
    insightSettings.homeTown,
    insightSettings.stepsEnabled,
    health.provider,
  ]);

  // After connecting, the first sync happens straight away.
  useEffect(() => {
    if (loaded && health.provider && !health.lastSync) syncHealth(true);
  }, [loaded, health.provider, health.lastSync, syncHealth]);

  const external = useMemo<ExternalSourceData[]>(() => {
    const list: ExternalSourceData[] = [];
    if (insightSettings.weatherEnabled && Object.keys(weather.days).length) {
      list.push({
        id: "weather",
        label: "Weather",
        metrics: WEATHER_METRICS,
        days: weather.days,
      });
    }
    if (insightSettings.stepsEnabled && Object.keys(steps.days).length) {
      list.push({
        id: "steps",
        label: "Phone steps",
        metrics: [PHONE_STEP_METRIC],
        days: steps.days,
      });
    }
    const samsung = imports.filter((b) => b.kind === "samsung");
    if (health.provider || samsung.length) {
      const metrics = new Map<string, ExternalMetric>();
      [
        ...metricsForTypes(health.types),
        ...samsung.flatMap((b) => b.metrics),
      ].forEach((m) => metrics.set(m.key, m));
      list.push({
        id: "health",
        label: health.provider
          ? (healthSource?.label ?? "Health app")
          : "Samsung Health import",
        metrics: [...metrics.values()],
        days: mergeDailyValues(health.days, ...samsung.map((b) => b.days)),
      });
    }
    for (const b of imports.filter((x) => x.kind === "csv")) {
      list.push({
        id: `import-${b.id}`,
        label: b.name,
        metrics: b.metrics,
        days: b.days,
      });
    }
    return list;
  }, [
    insightSettings.weatherEnabled,
    insightSettings.stepsEnabled,
    weather.days,
    steps.days,
    health,
    imports,
    healthSource,
  ]);

  const value: SourcesContextValue = {
    external,
    weather,
    weatherStatus,
    refreshWeather,
    findTowns: searchTowns,
    stepsAvailable,
    steps,
    syncSteps,
    healthAvailable,
    healthLabel: healthSource?.label ?? "Health app",
    health,
    healthStatus,
    connectHealth,
    disconnectHealth,
    syncHealth,
    openHealthSettings: healthSource?.openSettings,
    imports,
    addImport,
    removeImport,
    loadDemoWeather,
  };

  return (
    <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>
  );
}

export function useSources() {
  const context = useContext(SourcesContext);
  if (!context)
    throw new Error("useSources must be used within a SourcesProvider");
  return context;
}
