import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  OnboardingAxisId,
  OnboardingBundleId,
  ThemeModePreference,
} from "@/core/DataContext";
import { ModuleId } from "@/core/ModuleContext";
import { ThemeId } from "@/core/ThemeContext";

export interface OnboardingQuestion {
  axisId: OnboardingAxisId;
  title: string;
  prompt: string;
  options: string[];
}

export interface OnboardingBundle {
  id: OnboardingBundleId;
  title: string;
  description: string;
  moduleIds: ModuleId[];
}

export const ONBOARDING_CHALLENGE_AXES: OnboardingAxisId[] = [
  "executiveFunction",
  "healthWellbeingSafety",
  "sensoryRegulation",
  "mobilityNavigationSocial",
];

export const ONBOARDING_STRENGTH_QUESTIONS: OnboardingQuestion[] = [
  {
    axisId: "patternRecognition",
    title: "Pattern recognition & systems thinking",
    prompt:
      "When dealing with something complex, how quickly can you orient yourself?",
    options: [
      "I normally need examples.",
      "I tend to fiind structure.",
    ],
  },
  {
    axisId: "deepFocus",
    title: "Deep focus & specialist mastery",
    prompt:
      "For genuinely interests, how consistently can you focus?",
    options: [
      "Interest fades quickly, even for topics I like.",
      "Deep immersion is typical for me.",
    ],
  },
  {
    axisId: "creativity",
    title: "Creativity & lateral problem-solving",
    prompt:
      "When standard approaches fail, how often do you find alternatives?",
    options: [
      "I prefer known methods.",
      "I regularly make unexpected  connections.",
    ],
  },
  {
    axisId: "principledJudgement",
    title: "Bottom-up reasoning & principled judgement",
    prompt:
      "How much are your decisions driven by experience vs social convention?",
    options: [
      "I usually follow the local norm.",
      "Consistency is my strict default.",
    ],
  },
];

export const ONBOARDING_CHALLENGE_QUESTIONS: OnboardingQuestion[] = [
  {
    axisId: "executiveFunction",
    title: "Executive functioning & self-management",
    prompt:
      "How much effort is spent on planning, starting, switching, sequencing, and finishing?",
    options: [
      "Not a lot of effort most weeks.",
      "It is a massive consideration.",
    ],
  },
  {
    axisId: "healthWellbeingSafety",
    title: "Health, wellbeing & safety management",
    prompt:
      "How much effort is required to keep routines, appointments, and plans?",
    options: [
      "Mostly automatic and low effort.",
      "Needs strong systems/support.",
    ],
  },
  {
    axisId: "sensoryRegulation",
    title: "Sensory regulation & environmental fit",
    prompt:
      "How much do noise, lighting, interruptions, crowds, and unpredictability determine whether you can function?",
    options: [
      "Environment rarely affects my performance.",
      "Wrong conditions can severely affect my abilities.",
    ],
  },
  {
    axisId: "mobilityNavigationSocial",
    title: "Mobility, navigation & social participation",
    prompt:
      "How limiting are travel disruption and crowded environments?",
    options: [
      "Rarely limiting, I adapt quickly.",
      "Core barrier requiring major support and preparation.",
    ],
  },
];

export const ONBOARDING_BUNDLES: OnboardingBundle[] = [
  {
    id: "sensoryShield",
    title: "Sensory Shield",
    description:
      "Keep things calm and minimal when environment fit is the main challenge.",
    moduleIds: [
      "alarms",
      "countdownTimer",
      "countUpTimer",
      "clipboardTray",
      "nfcModule",
    ],
  },
  {
    id: "startEngine",
    title: "Start Engine",
    description:
      "Reduce friction with task initiation, switching, and re-entry.",
    moduleIds: [
      "todoList",
      "alarms",
      "pomodoro",
      "countdownTimer",
      "clipboardTray",
      "gamification",
    ],
  },
  {
    id: "dailyControlDeck",
    title: "Daily Control Deck",
    description:
      "A balanced setup for mixed daily demands with low complexity.",
    moduleIds: [
      "calendar",
      "todoList",
      "alarms",
      "clipboardTray",
      "countdownTimer",
      "emergency",
    ],
  },
  {
    id: "outAndAbout",
    title: "Out & About",
    description:
      "Fast support for travel, disruption, and public-space stress.",
    moduleIds: [
      "emergency",
      "calendar",
      "countdownTimer",
      "alarms",
      "clipboardTray",
      "countUpTimer",
    ],
  },
  {
    id: "clearComms",
    title: "Clear Comms",
    description:
      "Support coordination and participation with predictable communication scaffolds.",
    moduleIds: [
      "clipboardTray",
      "calendar",
      "todoList",
      "countdownTimer",
      "alarms",
    ],
  },
  {
    id: "signalsAndPatterns",
    title: "Signals & Patterns",
    description:
      "Lightweight tracking and pattern awareness for ongoing self-management.",
    moduleIds: [
      "symptomTracker",
      "nfcModule",
      "countUpTimer",
      "spikyChart",
      "patternInsights",
    ],
  },
];

export const ONBOARDING_AXIS_LABELS: Record<OnboardingAxisId, string> = {
  patternRecognition: "Pattern recognition",
  deepFocus: "Deep focus",
  creativity: "Creativity",
  principledJudgement: "Principled judgement",
  executiveFunction: "Executive functioning",
  healthWellbeingSafety: "Health / wellbeing / safety",
  sensoryRegulation: "Sensory regulation",
  mobilityNavigationSocial: "Mobility / navigation / participation",
};

const DEFAULT_AXIS_SCORES: Record<OnboardingAxisId, number> = {
  patternRecognition: 3,
  deepFocus: 3,
  creativity: 3,
  principledJudgement: 3,
  executiveFunction: 3,
  healthWellbeingSafety: 3,
  sensoryRegulation: 3,
  mobilityNavigationSocial: 3,
};

const getBundleById = (bundleId: OnboardingBundleId): OnboardingBundle =>
  ONBOARDING_BUNDLES.find((bundle) => bundle.id === bundleId) ??
  ONBOARDING_BUNDLES[2];

const recommendBundle = (
  scores: Record<OnboardingAxisId, number>,
): OnboardingBundleId => {
  const sensory = scores.sensoryRegulation;
  const executive = scores.executiveFunction;
  const health = scores.healthWellbeingSafety;
  const mobility = scores.mobilityNavigationSocial;
  const pattern = scores.patternRecognition;
  const deepFocus = scores.deepFocus;
  const principled = scores.principledJudgement;

  if (
    sensory >= 4 &&
    sensory >= executive &&
    sensory >= health &&
    sensory >= mobility
  ) {
    return "sensoryShield";
  }
  if (
    executive >= 4 &&
    executive >= sensory &&
    executive >= health &&
    executive >= mobility
  ) {
    return "startEngine";
  }
  if (mobility >= 4 && mobility >= sensory && mobility >= executive) {
    return principled >= 4 ? "clearComms" : "outAndAbout";
  }
  if (health >= 4 && (pattern >= 4 || deepFocus >= 4)) {
    return "signalsAndPatterns";
  }
  if (pattern >= 4 && deepFocus >= 4 && health >= 3) {
    return "signalsAndPatterns";
  }
  return "dailyControlDeck";
};

interface OnboardingFlowContextType {
  displayName: string;
  setDisplayName: (name: string) => void;
  themeModePreference: ThemeModePreference;
  setThemeModePreference: (preference: ThemeModePreference) => void;
  preferredThemeId: ThemeId;
  setPreferredThemeId: (themeId: ThemeId) => void;
  axisScores: Record<OnboardingAxisId, number>;
  setAxisScore: (axisId: OnboardingAxisId, score: number) => void;
  recommendedBundle: OnboardingBundleId;
  selectedBundle: OnboardingBundleId;
  setSelectedBundle: (bundleId: OnboardingBundleId) => void;
  selectedModules: ModuleId[];
  toggleSelectedModule: (moduleId: ModuleId) => void;
  setSelectedModules: (moduleIds: ModuleId[]) => void;
  topChallengeAxis: OnboardingAxisId;
  hydrateFromProfile: (params: {
    displayName?: string;
    themeModePreference: ThemeModePreference;
    preferredThemeId?: string;
    axisScores: Record<OnboardingAxisId, number>;
    selectedBundle: OnboardingBundleId;
    selectedModules: string[];
  }) => void;
  resetOnboardingState: () => void;
}

const OnboardingFlowContext = createContext<
  OnboardingFlowContextType | undefined
>(undefined);

export function OnboardingFlowProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayName] = useState("");
  const [themeModePreference, setThemeModePreference] =
    useState<ThemeModePreference>("sameAsCurrent");
  const [preferredThemeId, setPreferredThemeId] = useState<ThemeId>("calmBlue");
  const [axisScores, setAxisScores] =
    useState<Record<OnboardingAxisId, number>>(DEFAULT_AXIS_SCORES);
  const initialBundle = "dailyControlDeck";
  const [selectedBundle, setSelectedBundleState] =
    useState<OnboardingBundleId>(initialBundle);
  const [selectedModules, setSelectedModulesState] = useState<ModuleId[]>(
    getBundleById(initialBundle).moduleIds,
  );

  const recommendedBundle = useMemo(
    () => recommendBundle(axisScores),
    [axisScores],
  );

  const topChallengeAxis = useMemo(() => {
    return ONBOARDING_CHALLENGE_AXES.reduce(
      (maxAxis, axisId) =>
        axisScores[axisId] > axisScores[maxAxis] ? axisId : maxAxis,
      "executiveFunction",
    );
  }, [axisScores]);

  const setAxisScore = (axisId: OnboardingAxisId, score: number) => {
    const safeScore = Math.max(1, Math.min(5, Math.round(score)));
    setAxisScores((prev) => ({ ...prev, [axisId]: safeScore }));
  };

  const setSelectedBundle = (bundleId: OnboardingBundleId) => {
    const bundle = getBundleById(bundleId);
    setSelectedBundleState(bundle.id);
    setSelectedModulesState(bundle.moduleIds);
  };

  const toggleSelectedModule = (moduleId: ModuleId) => {
    setSelectedModulesState((prev) => {
      if (prev.includes(moduleId)) {
        return prev.filter((id) => id !== moduleId);
      }
      return [...prev, moduleId];
    });
  };

  const setSelectedModules = (moduleIds: ModuleId[]) => {
    setSelectedModulesState(Array.from(new Set(moduleIds)));
  };

  const hydrateFromProfile = ({
    displayName: nextDisplayName,
    themeModePreference: nextThemeModePreference,
    preferredThemeId: nextPreferredThemeId,
    axisScores: nextAxisScores,
    selectedBundle: nextSelectedBundle,
    selectedModules: nextSelectedModules,
  }: {
    displayName?: string;
    themeModePreference: ThemeModePreference;
    preferredThemeId?: string;
    axisScores: Record<OnboardingAxisId, number>;
    selectedBundle: OnboardingBundleId;
    selectedModules: string[];
  }) => {
    setDisplayName(nextDisplayName ?? "");
    setThemeModePreference(nextThemeModePreference);
    setPreferredThemeId((nextPreferredThemeId as ThemeId) ?? "calmBlue");
    setAxisScores(nextAxisScores);
    setSelectedBundleState(nextSelectedBundle);
    const allowedModules = new Set(
      getBundleById("dailyControlDeck")
        .moduleIds.concat(getBundleById("sensoryShield").moduleIds)
        .concat(getBundleById("startEngine").moduleIds)
        .concat(getBundleById("outAndAbout").moduleIds)
        .concat(getBundleById("clearComms").moduleIds)
        .concat(getBundleById("signalsAndPatterns").moduleIds),
    );
    const nextSelection = nextSelectedModules.filter(
      (moduleId): moduleId is ModuleId =>
        allowedModules.has(moduleId as ModuleId),
    );
    setSelectedModulesState(
      nextSelection.length > 0
        ? nextSelection
        : getBundleById(nextSelectedBundle).moduleIds,
    );
  };

  const resetOnboardingState = () => {
    setDisplayName("");
    setThemeModePreference("sameAsCurrent");
    setPreferredThemeId("calmBlue");
    setAxisScores(DEFAULT_AXIS_SCORES);
    setSelectedBundleState(initialBundle);
    setSelectedModulesState(getBundleById(initialBundle).moduleIds);
  };

  return (
    <OnboardingFlowContext.Provider
      value={{
        displayName,
        setDisplayName,
        themeModePreference,
        setThemeModePreference,
        preferredThemeId,
        setPreferredThemeId,
        axisScores,
        setAxisScore,
        recommendedBundle,
        selectedBundle,
        setSelectedBundle,
        selectedModules,
        toggleSelectedModule,
        setSelectedModules,
        topChallengeAxis,
        hydrateFromProfile,
        resetOnboardingState,
      }}
    >
      {children}
    </OnboardingFlowContext.Provider>
  );
}

export function useOnboardingFlow() {
  const context = useContext(OnboardingFlowContext);
  if (!context) {
    throw new Error(
      "useOnboardingFlow must be used within an OnboardingFlowProvider",
    );
  }
  return context;
}
