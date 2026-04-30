import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ModuleId =
  | "symptomTracker"
  | "clipboardTray"
  | "spikyChart"
  | "patternInsights"
  | "nfcModule"
  | "gamification"
  | "todoList"
  | "calendar"
  | "pomodoro"
  | "emergency"
  | "customTrackers"
  | "alarms"
  | "countdownTimer"
  | "countUpTimer";

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const DEFAULT_MODULES: ModuleConfig[] = [
  {
    id: "symptomTracker",
    name: "Symptom Tracker",
    description: "Log mood, energy, and cognitive symptoms",
    icon: "activity",
    enabled: true,
  },
  {
    id: "clipboardTray",
    name: "Clipboard Tray",
    description: "Multi-item holder for tasks and notes",
    icon: "clipboard",
    enabled: true,
  },
  {
    id: "spikyChart",
    name: "Spiky Profile Chart",
    description: "Visualize cognitive peaks and valleys",
    icon: "trending-up",
    enabled: true,
  },
  {
    id: "patternInsights",
    name: "Pattern Insights",
    description: "Detect correlations and get suggestions",
    icon: "zap",
    enabled: true,
  },
  {
    id: "nfcModule",
    name: "Quick Log",
    description: "Quick tap to log meds and habits",
    icon: "zap",
    enabled: true,
  },
  {
    id: "gamification",
    name: "Rewards",
    description: "XP and streaks for consistent tracking",
    icon: "award",
    enabled: true,
  },
  {
    id: "todoList",
    name: "To-Do List",
    description: "Keep track of tasks and reminders",
    icon: "check-square",
    enabled: true,
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "View events and reminders on a calendar",
    icon: "calendar",
    enabled: true,
  },
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "Focus timer with breaks and rewards",
    icon: "clock",
    enabled: true,
  },
  {
    id: "emergency",
    name: "Emergency Button",
    description: "Quick alert to emergency contacts",
    icon: "alert-circle",
    enabled: true,
  },
  {
    id: "customTrackers",
    name: "Custom Trackers",
    description: "Create your own things to track",
    icon: "sliders",
    enabled: false,
  },
  {
    id: "alarms",
    name: "Automated Alarms",
    description: "Set repeating alarms at intervals",
    icon: "bell",
    enabled: true,
  },
  {
    id: "countdownTimer",
    name: "Countdown Timer",
    description: "Count down to important events and appointments",
    icon: "clock",
    enabled: true,
  },
  {
    id: "countUpTimer",
    name: "Time Since...",
    description: "Track time since last medication, meal, or activity",
    icon: "activity",
    enabled: true,
  },
];

const STORAGE_KEY = "@spikeyprofile/modules";

interface ModuleContextType {
  modules: ModuleConfig[];
  toggleModule: (id: ModuleId) => void;
  setEnabledModules: (enabledIds: ModuleId[]) => void;
  isModuleEnabled: (id: ModuleId) => boolean;
  resetToDefaults: () => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedModules = JSON.parse(stored) as ModuleConfig[];
        const mergedModules = DEFAULT_MODULES.map((defaultModule) => {
          const storedModule = storedModules.find((m) => m.id === defaultModule.id);
          return storedModule ? { ...defaultModule, enabled: storedModule.enabled } : defaultModule;
        });
        setModules(mergedModules);
      }
    } catch (error) {
      console.error("Failed to load modules:", error);
    }
  };

  const saveModules = useCallback(async (newModules: ModuleConfig[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newModules));
    } catch (error) {
      console.error("Failed to save modules:", error);
    }
  }, []);

  const toggleModule = useCallback((id: ModuleId) => {
    setModules((prev) => {
      const updated = prev.map((module) =>
        module.id === id ? { ...module, enabled: !module.enabled } : module
      );
      saveModules(updated);
      return updated;
    });
  }, [saveModules]);

  const setEnabledModules = useCallback(
    (enabledIds: ModuleId[]) => {
      setModules((prev) => {
        const enabledSet = new Set(enabledIds);
        const updated = prev.map((module) => ({
          ...module,
          enabled: enabledSet.has(module.id),
        }));
        saveModules(updated);
        return updated;
      });
    },
    [saveModules],
  );

  const isModuleEnabled = useCallback((id: ModuleId): boolean => {
    return modules.find((m) => m.id === id)?.enabled ?? false;
  }, [modules]);

  const resetToDefaults = useCallback(() => {
    setModules(DEFAULT_MODULES);
    saveModules(DEFAULT_MODULES);
  }, [saveModules]);

  return (
    <ModuleContext.Provider
      value={{ modules, toggleModule, setEnabledModules, isModuleEnabled, resetToDefaults }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModules must be used within a ModuleProvider");
  }
  return context;
}
