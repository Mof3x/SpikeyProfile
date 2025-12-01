import React, { createContext, useContext, useState, ReactNode } from "react";

export type ModuleId =
  | "symptomTracker"
  | "clipboardTray"
  | "spikyChart"
  | "patternInsights"
  | "nfcModule"
  | "gamification";

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
    name: "Quick Tap",
    description: "Simulated NFC tap for quick logging",
    icon: "radio",
    enabled: false,
  },
  {
    id: "gamification",
    name: "Rewards",
    description: "XP and streaks for consistent tracking",
    icon: "award",
    enabled: true,
  },
];

interface ModuleContextType {
  modules: ModuleConfig[];
  toggleModule: (id: ModuleId) => void;
  isModuleEnabled: (id: ModuleId) => boolean;
  resetToDefaults: () => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);

  const toggleModule = (id: ModuleId) => {
    setModules((prev) =>
      prev.map((module) =>
        module.id === id ? { ...module, enabled: !module.enabled } : module
      )
    );
  };

  const isModuleEnabled = (id: ModuleId): boolean => {
    return modules.find((m) => m.id === id)?.enabled ?? false;
  };

  const resetToDefaults = () => {
    setModules(DEFAULT_MODULES);
  };

  return (
    <ModuleContext.Provider
      value={{ modules, toggleModule, isModuleEnabled, resetToDefaults }}
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
