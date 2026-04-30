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
      "When you are dropped into something complex, how quickly do system structure and failure points become clear?",
    options: [
      "I usually follow examples rather than seeing system structure first.",
      "I can understand parts, but full system mapping takes time.",
      "I build a rough map and notice some inconsistencies.",
      "I quickly model the system and spot edge cases early.",
      "I naturally debug and optimize systems almost immediately.",
    ],
  },
  {
    axisId: "deepFocus",
    title: "Deep focus & specialist mastery",
    prompt:
      "For topics that genuinely interest you, how consistently can you sustain focus and build depth?",
    options: [
      "Interest fades quickly, even for topics I like.",
      "I engage, but usually need external structure to keep momentum.",
      "I can go deep in bursts, but consistency varies.",
      "I reliably go deep and sustain progress over time.",
      "Deep immersion is typical for me, with rapid learning and detail focus.",
    ],
  },
  {
    axisId: "creativity",
    title: "Creativity & lateral problem-solving",
    prompt:
      "When standard approaches fail, how often do you generate non-obvious alternatives?",
    options: [
      "I prefer known methods and rarely explore alternatives.",
      "I try small variations near the standard approach.",
      "I can reframe problems and find alternatives with time.",
      "I naturally generate multiple valid reframes.",
      "I regularly make unexpected cross-domain connections.",
    ],
  },
  {
    axisId: "principledJudgement",
    title: "Bottom-up reasoning & principled judgement",
    prompt:
      "Under pressure, how much are your decisions driven by evidence/consistency vs social convention?",
    options: [
      "I usually follow the local norm or authority expectation.",
      "I balance norms with my own view, but default to convention.",
      "I aim for evidence-led decisions, though context can sway me.",
      "I am strongly principle and evidence driven.",
      "Principled consistency is my default, even when unpopular.",
    ],
  },
];

export const ONBOARDING_CHALLENGE_QUESTIONS: OnboardingQuestion[] = [
  {
    axisId: "executiveFunction",
    title: "Executive functioning & self-management",
    prompt:
      "Even when trying your best, how much effort is spent on planning, starting, switching, sequencing, and finishing?",
    options: [
      "A lot of effort most weeks.",
      "Some effort, but manageable with light reminders.",
      "Noticeable effort and frequent friction.",
      "High effort without a lot of structure.",
      "It is a massive consideration.",
    ],
  },
  {
    axisId: "healthWellbeingSafety",
    title: "Health, wellbeing & safety management",
    prompt:
      "How much effort is required to keep routines, meds, appointments, and safety plans stable?",
    options: [
      "Mostly automatic and low effort.",
      "Manageable with light support tools.",
      "Recurring management task with occasional misses.",
      "Hard to keep stable; missed steps are common.",
      "Major ongoing project that needs strong systems/support.",
    ],
  },
  {
    axisId: "sensoryRegulation",
    title: "Sensory regulation & environmental fit",
    prompt:
      "How much do noise, lighting, interruptions, crowds, and unpredictability determine whether you can function?",
    options: [
      "Environment rarely affects my performance.",
      "Some settings are difficult but usually manageable.",
      "I need active planning to avoid overload in some contexts.",
      "Environmental fit is often a deciding factor.",
      "Wrong conditions can shut down thinking/communication/action.",
    ],
  },
  {
    axisId: "mobilityNavigationSocial",
    title: "Mobility, navigation & social participation",
    prompt:
      "How limiting are travel disruption, wayfinding, crowded environments, and communication load in practice?",
    options: [
      "Rarely limiting; I adapt quickly.",
      "Mildly limiting; planning helps but changes are manageable.",
      "Moderately limiting; I avoid some contexts or need prep.",
      "Strongly limiting; disruptions and interaction load derail plans.",
      "Core barrier requiring major support and recovery.",
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
