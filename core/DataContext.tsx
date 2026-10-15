import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_INSIGHT_SETTINGS,
  DEFAULT_INTAKE_CONFIG,
  SAMPLE_ENTRY_IDS,
} from "@/core/dataConstants";

export interface SymptomEntry {
  id: string;
  timestamp: Date;
  mood: number;
  energy: number;
  brainFog: number;
  sensoryOverload: number;
  executiveDysfunction: number;
  notes?: string;
  sleepHours?: number;
  sleepQuality?: number;
  source?: "manual" | "quickTap";
}

export interface ClipboardItem {
  id: string;
  text: string;
  createdAt: Date;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "reminder" | "event" | "symptom";
  recurring?: "daily" | "weekly" | "monthly" | null;
  completed?: boolean;
}

export interface CustomTracker {
  id: string;
  name: string;
  inputType: "slider" | "toggle" | "counter" | "text" | "color";
  icon: string;
  enabled: boolean;
}

export interface CustomTrackerEntry {
  id: string;
  trackerId: string;
  value: string | number | boolean;
  timestamp: Date;
}

export interface QuickLogAction {
  id: string;
  name: string;
  icon: string;
  category: "medication" | "habit" | "custom";
  enabled: boolean;
}

export interface QuickLogEntry {
  id: string;
  actionId: string;
  actionName: string;
  timestamp: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface MedicalInfo {
  allergies: string[];
  medications: string[];
  diagnoses: string[];
  bloodType: string;
  notes: string;
}

export interface CrisisScript {
  id: string;
  title: string;
  content: string;
  category: "sensory" | "anxiety" | "meltdown" | "medical" | "custom";
  enabled: boolean;
}

export interface LowSensorySettings {
  enabled: boolean;
  reduceAnimations: boolean;
  reduceContrast: boolean;
  quietHaptics: boolean;
  simplifyUI: boolean;
  muteNotificationSounds: boolean;
}

export interface CountdownTimer {
  id: string;
  name: string;
  targetDate: Date;
  category: "appointment" | "medication" | "deadline" | "event" | "custom";
  icon: string;
  color: string;
  enabled: boolean;
  notifyBefore?: number; // minutes before to notify
  recurrenceEnabled?: boolean;
  recurrenceEvery?: number;
  recurrenceUnit?: "days" | "weeks";
  recurrenceEndDate?: Date | null;
}

export interface CountUpTimer {
  id: string;
  name: string;
  startTime: Date;
  category: "medication" | "meal" | "task" | "custom";
  icon: string;
  color: string;
  enabled: boolean;
  targetHours?: number; // optional target duration
}

export interface AlarmSchedule {
  id: string;
  name: string;
  enabled: boolean;
  startTime: Date;
  endTime: Date;
  numberOfAlarms: number;
  intervalType: "uniform" | "custom";
  customIntervals?: number[];
  sound: string;
  vibrate: boolean;
  recurrenceEnabled?: boolean;
  recurrenceEvery?: number;
  recurrenceUnit?: "days" | "weeks";
  recurrenceEndDate?: Date | null;
  notificationIds: string[];
  createdAt: Date;
}

export interface UserStats {
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  lastEntryDate: Date | null;
}

export interface PatternInsight {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "positive" | "neutral" | "warning";
  plain?: string;
  numbers?: string;
  basis?: string;
}

export type ExerciseType = "walk" | "run" | "gym" | "yoga" | "cycle" | "swim" | "sport" | "other";

export interface ExerciseEntry {
  id: string;
  timestamp: Date;
  type: ExerciseType;
  minutes: number;
  intensity: 1 | 2 | 3;
}

export type IntakeCategory = "meal" | "snack" | "drink" | "substance";

export interface IntakeEntry {
  id: string;
  timestamp: Date;
  category: IntakeCategory;
  item: string;
  amount?: number;
  tags?: string[];
}

export interface SubstanceDef {
  id: string;
  name: string;
  unit: string;
  stimulant?: boolean;
  enabled: boolean;
}

export interface IntakeConfig {
  tags: string[];
  hiddenTags: string[];
  substances: SubstanceDef[];
}

export interface FocusSession {
  id: string;
  endedAt: Date;
  minutes: number;
}

export type PeriodFlow = "spotting" | "light" | "medium" | "heavy";

export interface PeriodDay {
  date: string;
  flow?: PeriodFlow;
}

export type DayNoteReason = "unwell" | "period" | "busy" | "lowMood" | "feltGreat" | "justDidnt";

export interface DayNote {
  date: string;
  overall?: number;
  reasons: DayNoteReason[];
  createdAt: Date;
}

export type AgeRange = "16-24" | "25-34" | "35-44" | "45-54" | "55+" | "preferNot";

export interface HomeTown {
  name: string;
  latitude: number;
  longitude: number;
}

export interface InsightSettings {
  showNumbers: boolean;
  outlookNotifications: boolean;
  medNudges: boolean;
  lowEffortCheckins: boolean;
  medSlipHeadsUp: boolean;
  weatherEnabled: boolean;
  weatherMode: "gps" | "town";
  homeTown: HomeTown | null;
  stepsEnabled: boolean;
  substancesEnabled: boolean;
}

export type OnboardingAxisId =
  | "patternRecognition"
  | "deepFocus"
  | "creativity"
  | "principledJudgement"
  | "executiveFunction"
  | "healthWellbeingSafety"
  | "sensoryRegulation"
  | "mobilityNavigationSocial";

export type OnboardingBundleId =
  | "sensoryShield"
  | "startEngine"
  | "dailyControlDeck"
  | "outAndAbout"
  | "clearComms"
  | "signalsAndPatterns";

export type ThemeModePreference = "light" | "dark" | "sameAsCurrent";

export interface OnboardingProfile {
  axisScores: Record<OnboardingAxisId, number>;
  displayName?: string;
  themeModePreference: ThemeModePreference;
  preferredThemeId?: string;
  recommendedBundle: OnboardingBundleId;
  selectedBundle: OnboardingBundleId;
  selectedModules: string[];
  completedAt: Date;
  skipped: boolean;
}

export type WidgetId = 
  | "gamification" 
  | "symptomTracker" 
  | "todoList" 
  | "calendar" 
  | "nfcModule" 
  | "pomodoro" 
  | "alarms" 
  | "clipboardTray" 
  | "patternInsights" 
  | "emergency"
  | "countdown"
  | "countup";

export const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  "gamification",
  "symptomTracker",
  "todoList",
  "calendar",
  "nfcModule",
  "pomodoro",
  "alarms",
  "countdown",
  "countup",
  "clipboardTray",
  "patternInsights",
  "emergency",
];

interface DataContextType {
  symptomEntries: SymptomEntry[];
  addSymptomEntry: (entry: Omit<SymptomEntry, "id" | "timestamp">, timestamp?: Date) => void;
  removeSymptomEntry: (id: string) => void;
  clipboardItems: ClipboardItem[];
  addClipboardItem: (text: string) => void;
  removeClipboardItem: (id: string) => void;
  updateClipboardItem: (id: string, text: string) => void;
  reorderClipboardItems: (items: ClipboardItem[]) => void;
  todos: TodoItem[];
  addTodo: (text: string, dueDate?: Date) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateTodo: (id: string, text: string) => void;
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  removeCalendarEvent: (id: string) => void;
  toggleCalendarEventComplete: (id: string) => void;
  customTrackers: CustomTracker[];
  addCustomTracker: (tracker: Omit<CustomTracker, "id">) => void;
  removeCustomTracker: (id: string) => void;
  toggleCustomTracker: (id: string) => void;
  customTrackerEntries: CustomTrackerEntry[];
  addCustomTrackerEntry: (trackerId: string, value: string | number | boolean) => void;
  quickLogActions: QuickLogAction[];
  addQuickLogAction: (action: Omit<QuickLogAction, "id">) => void;
  removeQuickLogAction: (id: string) => void;
  toggleQuickLogAction: (id: string) => void;
  quickLogEntries: QuickLogEntry[];
  logQuickAction: (actionId: string) => void;
  addQuickLogEntry: (actionName: string, timestamp?: Date) => void;
  removeQuickLogEntry: (id: string) => void;
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: Omit<EmergencyContact, "id">) => void;
  removeEmergencyContact: (id: string) => void;
  updateEmergencyContact: (id: string, contact: Partial<EmergencyContact>) => void;
  emergencyMessage: string;
  setEmergencyMessage: (message: string) => void;
  medicalInfo: MedicalInfo;
  setMedicalInfo: (info: MedicalInfo) => void;
  crisisScripts: CrisisScript[];
  addCrisisScript: (script: Omit<CrisisScript, "id">) => void;
  removeCrisisScript: (id: string) => void;
  updateCrisisScript: (id: string, script: Partial<CrisisScript>) => void;
  alarmSchedules: AlarmSchedule[];
  addAlarmSchedule: (schedule: Omit<AlarmSchedule, "id" | "createdAt" | "notificationIds">) => void;
  updateAlarmSchedule: (id: string, schedule: Partial<AlarmSchedule>) => void;
  removeAlarmSchedule: (id: string) => void;
  toggleAlarmSchedule: (id: string) => void;
  userStats: UserStats;
  userName: string;
  setUserName: (name: string) => void;
  profileImageUri: string | null;
  setProfileImageUri: (uri: string | null) => void;
  widgetOrder: WidgetId[];
  setWidgetOrder: (order: WidgetId[]) => void;
  lowSensorySettings: LowSensorySettings;
  setLowSensorySettings: (settings: LowSensorySettings) => void;
  countdownTimers: CountdownTimer[];
  addCountdownTimer: (timer: Omit<CountdownTimer, "id">) => void;
  updateCountdownTimer: (id: string, timer: Partial<CountdownTimer>) => void;
  removeCountdownTimer: (id: string) => void;
  countUpTimers: CountUpTimer[];
  addCountUpTimer: (timer: Omit<CountUpTimer, "id">) => void;
  updateCountUpTimer: (id: string, timer: Partial<CountUpTimer>) => void;
  removeCountUpTimer: (id: string) => void;
  resetCountUpTimer: (id: string) => void;
  groupQuickLogs: boolean;
  setGroupQuickLogs: (enabled: boolean) => void;
  groupTodos: boolean;
  setGroupTodos: (enabled: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  onboardingProfile: OnboardingProfile | null;
  saveOnboardingProfile: (profile: OnboardingProfile) => void;
  clearOnboardingProfile: () => void;
  deviceStorageEnabled: boolean;
  setDeviceStorageEnabled: (enabled: boolean) => void;
  clearAllDeviceData: () => void;
  dataResetCount: number;
  exerciseEntries: ExerciseEntry[];
  addExerciseEntry: (entry: Omit<ExerciseEntry, "id" | "timestamp">, timestamp?: Date) => void;
  removeExerciseEntry: (id: string) => void;
  intakeEntries: IntakeEntry[];
  addIntakeEntry: (entry: Omit<IntakeEntry, "id" | "timestamp">, timestamp?: Date) => void;
  removeIntakeEntry: (id: string) => void;
  intakeConfig: IntakeConfig;
  setIntakeConfig: (config: IntakeConfig) => void;
  focusSessions: FocusSession[];
  addFocusSession: (minutes: number) => void;
  periodDays: PeriodDay[];
  setPeriodDay: (date: string, flow?: PeriodFlow) => void;
  removePeriodDay: (date: string) => void;
  dayNotes: DayNote[];
  saveDayNotes: (dates: string[], note: Omit<DayNote, "date" | "createdAt">) => void;
  ageRange: AgeRange | null;
  setAgeRange: (range: AgeRange | null) => void;
  insightSettings: InsightSettings;
  updateInsightSettings: (changes: Partial<InsightSettings>) => void;
  updateCustomTracker: (id: string, changes: Partial<CustomTracker>) => void;
  removeCustomTrackerEntry: (id: string) => void;
  loadDemoData: (data: DemoDataBundle) => void;
  isLoading: boolean;
}

export { DEFAULT_INSIGHT_SETTINGS, DEFAULT_INTAKE_CONFIG, SAMPLE_ENTRY_IDS };

export interface DemoDataBundle {
  symptomEntries: SymptomEntry[];
  quickLogActions: QuickLogAction[];
  quickLogEntries: QuickLogEntry[];
  todos: TodoItem[];
  calendarEvents: CalendarEvent[];
  exerciseEntries: ExerciseEntry[];
  intakeEntries: IntakeEntry[];
  focusSessions: FocusSession[];
  periodDays: PeriodDay[];
  customTrackers: CustomTracker[];
  customTrackerEntries: CustomTrackerEntry[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  symptomEntries: "@spikeyprofile/symptomEntries",
  clipboardItems: "@spikeyprofile/clipboardItems",
  todos: "@spikeyprofile/todos",
  calendarEvents: "@spikeyprofile/calendarEvents",
  customTrackers: "@spikeyprofile/customTrackers",
  customTrackerEntries: "@spikeyprofile/customTrackerEntries",
  quickLogActions: "@spikeyprofile/quickLogActions",
  quickLogEntries: "@spikeyprofile/quickLogEntries",
  emergencyContacts: "@spikeyprofile/emergencyContacts",
  emergencyMessage: "@spikeyprofile/emergencyMessage",
  alarmSchedules: "@spikeyprofile/alarmSchedules",
  userStats: "@spikeyprofile/userStats",
  userName: "@spikeyprofile/userName",
  profileImageUri: "@spikeyprofile/profileImageUri",
  widgetOrder: "@spikeyprofile/widgetOrder",
  medicalInfo: "@spikeyprofile/medicalInfo",
  crisisScripts: "@spikeyprofile/crisisScripts",
  lowSensorySettings: "@spikeyprofile/lowSensorySettings",
  countdownTimers: "@spikeyprofile/countdownTimers",
  countUpTimers: "@spikeyprofile/countUpTimers",
  groupQuickLogs: "@spikeyprofile/groupQuickLogs",
  groupTodos: "@spikeyprofile/groupTodos",
  onboardingComplete: "@spikeyprofile/onboardingComplete",
  onboardingProfile: "@spikeyprofile/onboardingProfile",
  deviceStorageEnabled: "@spikeyprofile/deviceStorageEnabled",
  exerciseEntries: "@spikeyprofile/exerciseEntries",
  intakeEntries: "@spikeyprofile/intakeEntries",
  intakeConfig: "@spikeyprofile/intakeConfig",
  focusSessions: "@spikeyprofile/focusSessions",
  periodDays: "@spikeyprofile/periodDays",
  dayNotes: "@spikeyprofile/dayNotes",
  ageRange: "@spikeyprofile/ageRange",
  insightSettings: "@spikeyprofile/insightSettings",
};

const DEFAULT_LOW_SENSORY_SETTINGS: LowSensorySettings = {
  enabled: false,
  reduceAnimations: false,
  reduceContrast: false,
  quietHaptics: false,
  simplifyUI: false,
  muteNotificationSounds: false,
};

const DEFAULT_MEDICAL_INFO: MedicalInfo = {
  allergies: [],
  medications: [],
  diagnoses: [],
  bloodType: "",
  notes: "",
};

const DEFAULT_CRISIS_SCRIPTS: CrisisScript[] = [
  {
    id: "1",
    title: "Sensory Overload",
    content: "I am autistic and currently experiencing sensory overload. I need a quieter, calmer environment. Please speak softly and reduce bright lights if possible.",
    category: "sensory",
    enabled: true,
  },
  {
    id: "2",
    title: "Anxiety Attack",
    content: "I am having an anxiety attack. I am not in danger but need a moment to calm down. Please give me space and speak calmly.",
    category: "anxiety",
    enabled: true,
  },
  {
    id: "3",
    title: "Processing Difficulty",
    content: "I have ADHD/autism and am having trouble processing information right now. Please speak slowly and give me time to respond.",
    category: "meltdown",
    enabled: true,
  },
  {
    id: "4",
    title: "Medical Information",
    content: "I have medical conditions that affect my behavior. Please check my phone for medical information and emergency contacts.",
    category: "medical",
    enabled: true,
  },
];

const INITIAL_STATS: UserStats = {
  totalEntries: 0,
  currentStreak: 0,
  longestStreak: 0,
  xp: 0,
  level: 1,
  lastEntryDate: null,
};

const DEFAULT_QUICK_LOG_ACTIONS: QuickLogAction[] = [
  { id: "1", name: "Morning Meds", icon: "sun", category: "medication", enabled: true },
  { id: "2", name: "Evening Meds", icon: "moon", category: "medication", enabled: true },
  { id: "3", name: "Drank Water", icon: "droplet", category: "habit", enabled: true },
  { id: "4", name: "Took a Break", icon: "coffee", category: "habit", enabled: true },
  { id: "5", name: "Went Outside", icon: "wind", category: "habit", enabled: true },
];

const serializeData = (data: any): string => {
  return JSON.stringify(data, (key, value) => {
    if (value instanceof Date) {
      return { __type: "Date", value: value.toISOString() };
    }
    return value;
  });
};

const deserializeData = (json: string): any => {
  return JSON.parse(json, (key, value) => {
    if (value && typeof value === "object" && value.__type === "Date") {
      return new Date(value.value);
    }
    return value;
  });
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceStorageEnabled, setDeviceStorageEnabledState] =
    useState(true);
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [customTrackers, setCustomTrackers] = useState<CustomTracker[]>([]);
  const [customTrackerEntries, setCustomTrackerEntries] = useState<CustomTrackerEntry[]>([]);
  const [quickLogActions, setQuickLogActions] = useState<QuickLogAction[]>(DEFAULT_QUICK_LOG_ACTIONS);
  const [quickLogEntries, setQuickLogEntries] = useState<QuickLogEntry[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyMessage, setEmergencyMessageState] = useState("Help - please contact me");
  const [medicalInfo, setMedicalInfoState] = useState<MedicalInfo>(DEFAULT_MEDICAL_INFO);
  const [crisisScripts, setCrisisScripts] = useState<CrisisScript[]>(DEFAULT_CRISIS_SCRIPTS);
  const [lowSensorySettings, setLowSensorySettingsState] = useState<LowSensorySettings>(DEFAULT_LOW_SENSORY_SETTINGS);
  const [alarmSchedules, setAlarmSchedules] = useState<AlarmSchedule[]>([]);
  const [countdownTimers, setCountdownTimers] = useState<CountdownTimer[]>([]);
  const [countUpTimers, setCountUpTimers] = useState<CountUpTimer[]>([]);
  const [groupQuickLogs, setGroupQuickLogsState] = useState(true);
  const [groupTodos, setGroupTodosState] = useState(true);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [onboardingProfile, setOnboardingProfileState] = useState<OnboardingProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_STATS);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);
  const [intakeEntries, setIntakeEntries] = useState<IntakeEntry[]>([]);
  const [intakeConfig, setIntakeConfigState] = useState<IntakeConfig>(DEFAULT_INTAKE_CONFIG);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [periodDays, setPeriodDays] = useState<PeriodDay[]>([]);
  const [dayNotes, setDayNotes] = useState<DayNote[]>([]);
  const [ageRange, setAgeRangeState] = useState<AgeRange | null>(null);
  const [insightSettings, setInsightSettings] = useState<InsightSettings>(DEFAULT_INSIGHT_SETTINGS);
  const [dataResetCount, setDataResetCount] = useState(0);
  const [userName, setUserNameState] = useState("");
  const [profileImageUri, setProfileImageUriState] = useState<string | null>(null);
  const [widgetOrder, setWidgetOrderState] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER);

  useEffect(() => {
    loadAllData();
  }, []);

  const resetAllState = useCallback(() => {
    setSymptomEntries([]);
    setClipboardItems([]);
    setTodos([]);
    setCalendarEvents([]);
    setCustomTrackers([]);
    setCustomTrackerEntries([]);
    setQuickLogActions(DEFAULT_QUICK_LOG_ACTIONS);
    setQuickLogEntries([]);
    setEmergencyContacts([]);
    setEmergencyMessageState("Help - please contact me");
    setMedicalInfoState(DEFAULT_MEDICAL_INFO);
    setCrisisScripts(DEFAULT_CRISIS_SCRIPTS);
    setLowSensorySettingsState(DEFAULT_LOW_SENSORY_SETTINGS);
    setAlarmSchedules([]);
    setCountdownTimers([]);
    setCountUpTimers([]);
    setGroupQuickLogsState(true);
    setGroupTodosState(true);
    setOnboardingCompleteState(false);
    setOnboardingProfileState(null);
    setUserStats(INITIAL_STATS);
    setUserNameState("");
    setProfileImageUriState(null);
    setWidgetOrderState(DEFAULT_WIDGET_ORDER);
    setExerciseEntries([]);
    setIntakeEntries([]);
    setIntakeConfigState(DEFAULT_INTAKE_CONFIG);
    setFocusSessions([]);
    setPeriodDays([]);
    setDayNotes([]);
    setAgeRangeState(null);
    setInsightSettings(DEFAULT_INSIGHT_SETTINGS);
    setDataResetCount((count) => count + 1);
  }, []);

  const clearAllDeviceData = useCallback(async () => {
    resetAllState();
    try {
      const keysToClear = Object.values(STORAGE_KEYS).filter(
        (key) => key !== STORAGE_KEYS.deviceStorageEnabled,
      );
      await AsyncStorage.multiRemove(keysToClear);
    } catch (error) {
      console.error("Failed to clear on-device data:", error);
    }
  }, [resetAllState]);

  const setDeviceStorageEnabled = useCallback(
    async (enabled: boolean) => {
      setDeviceStorageEnabledState(enabled);
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.deviceStorageEnabled,
          enabled.toString(),
        );
      } catch (error) {
        console.error("Failed to save storage preference:", error);
      }

      if (!enabled) {
        await clearAllDeviceData();
      }
    },
    [clearAllDeviceData],
  );

  const loadAllData = async () => {
    try {
      const storedStorageEnabled = await AsyncStorage.getItem(
        STORAGE_KEYS.deviceStorageEnabled,
      );
      const enabled = storedStorageEnabled !== "false";
      setDeviceStorageEnabledState(enabled);

      if (!enabled) {
        resetAllState();
        return;
      }

      const [
        storedSymptoms,
        storedClipboard,
        storedTodos,
        storedEvents,
        storedTrackers,
        storedTrackerEntries,
        storedQuickActions,
        storedQuickEntries,
        storedContacts,
        storedMessage,
        storedAlarms,
        storedStats,
        storedName,
        storedProfileImageUri,
        storedWidgetOrder,
        storedMedicalInfo,
        storedCrisisScripts,
        storedLowSensory,
        storedCountdownTimers,
        storedCountUpTimers,
        storedGroupQuickLogs,
        storedGroupTodos,
        storedOnboardingComplete,
        storedOnboardingProfile,
        storedExercise,
        storedIntake,
        storedIntakeConfig,
        storedFocus,
        storedPeriodDays,
        storedDayNotes,
        storedAgeRange,
        storedInsightSettings,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.symptomEntries),
        AsyncStorage.getItem(STORAGE_KEYS.clipboardItems),
        AsyncStorage.getItem(STORAGE_KEYS.todos),
        AsyncStorage.getItem(STORAGE_KEYS.calendarEvents),
        AsyncStorage.getItem(STORAGE_KEYS.customTrackers),
        AsyncStorage.getItem(STORAGE_KEYS.customTrackerEntries),
        AsyncStorage.getItem(STORAGE_KEYS.quickLogActions),
        AsyncStorage.getItem(STORAGE_KEYS.quickLogEntries),
        AsyncStorage.getItem(STORAGE_KEYS.emergencyContacts),
        AsyncStorage.getItem(STORAGE_KEYS.emergencyMessage),
        AsyncStorage.getItem(STORAGE_KEYS.alarmSchedules),
        AsyncStorage.getItem(STORAGE_KEYS.userStats),
        AsyncStorage.getItem(STORAGE_KEYS.userName),
        AsyncStorage.getItem(STORAGE_KEYS.profileImageUri),
        AsyncStorage.getItem(STORAGE_KEYS.widgetOrder),
        AsyncStorage.getItem(STORAGE_KEYS.medicalInfo),
        AsyncStorage.getItem(STORAGE_KEYS.crisisScripts),
        AsyncStorage.getItem(STORAGE_KEYS.lowSensorySettings),
        AsyncStorage.getItem(STORAGE_KEYS.countdownTimers),
        AsyncStorage.getItem(STORAGE_KEYS.countUpTimers),
        AsyncStorage.getItem(STORAGE_KEYS.groupQuickLogs),
        AsyncStorage.getItem(STORAGE_KEYS.groupTodos),
        AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete),
        AsyncStorage.getItem(STORAGE_KEYS.onboardingProfile),
        AsyncStorage.getItem(STORAGE_KEYS.exerciseEntries),
        AsyncStorage.getItem(STORAGE_KEYS.intakeEntries),
        AsyncStorage.getItem(STORAGE_KEYS.intakeConfig),
        AsyncStorage.getItem(STORAGE_KEYS.focusSessions),
        AsyncStorage.getItem(STORAGE_KEYS.periodDays),
        AsyncStorage.getItem(STORAGE_KEYS.dayNotes),
        AsyncStorage.getItem(STORAGE_KEYS.ageRange),
        AsyncStorage.getItem(STORAGE_KEYS.insightSettings),
      ]);

      if (storedSymptoms) setSymptomEntries(deserializeData(storedSymptoms));
      if (storedClipboard) setClipboardItems(deserializeData(storedClipboard));
      if (storedTodos) setTodos(deserializeData(storedTodos));
      if (storedEvents) setCalendarEvents(deserializeData(storedEvents));
      if (storedTrackers) setCustomTrackers(deserializeData(storedTrackers));
      if (storedTrackerEntries) setCustomTrackerEntries(deserializeData(storedTrackerEntries));
      if (storedQuickActions) setQuickLogActions(deserializeData(storedQuickActions));
      if (storedQuickEntries) setQuickLogEntries(deserializeData(storedQuickEntries));
      if (storedContacts) setEmergencyContacts(deserializeData(storedContacts));
      if (storedMessage) setEmergencyMessageState(storedMessage);
      if (storedAlarms) setAlarmSchedules(deserializeData(storedAlarms));
      if (storedStats) setUserStats(deserializeData(storedStats));
      if (storedName) setUserNameState(storedName);
      if (storedProfileImageUri !== null) {
        setProfileImageUriState(
          storedProfileImageUri && storedProfileImageUri !== "null"
            ? storedProfileImageUri
            : null,
        );
      }
      
      if (storedWidgetOrder) {
        try {
          const parsed = JSON.parse(storedWidgetOrder);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWidgetOrderState(parsed);
          }
        } catch {
          setWidgetOrderState(DEFAULT_WIDGET_ORDER);
        }
      }
      
      if (storedMedicalInfo) {
        try {
          const parsed = JSON.parse(storedMedicalInfo);
          setMedicalInfoState({ ...DEFAULT_MEDICAL_INFO, ...parsed });
        } catch {
          setMedicalInfoState(DEFAULT_MEDICAL_INFO);
        }
      }
      
      if (storedCrisisScripts) {
        try {
          const parsed = JSON.parse(storedCrisisScripts);
          if (Array.isArray(parsed)) {
            setCrisisScripts(parsed);
          }
        } catch {
          setCrisisScripts(DEFAULT_CRISIS_SCRIPTS);
        }
      }
      
      if (storedLowSensory) {
        try {
          const parsed = JSON.parse(storedLowSensory);
          setLowSensorySettingsState({ ...DEFAULT_LOW_SENSORY_SETTINGS, ...parsed });
        } catch {
          setLowSensorySettingsState(DEFAULT_LOW_SENSORY_SETTINGS);
        }
      }
      
      if (storedCountdownTimers) {
        try {
          setCountdownTimers(deserializeData(storedCountdownTimers));
        } catch {
          setCountdownTimers([]);
        }
      }
      
      if (storedCountUpTimers) {
        try {
          setCountUpTimers(deserializeData(storedCountUpTimers));
        } catch {
          setCountUpTimers([]);
        }
      }

      if (storedGroupQuickLogs !== null) {
        setGroupQuickLogsState(storedGroupQuickLogs === "true");
      }

      if (storedGroupTodos !== null) {
        setGroupTodosState(storedGroupTodos === "true");
      }

      if (storedOnboardingComplete !== null) {
        setOnboardingCompleteState(storedOnboardingComplete === "true");
      }

      if (storedOnboardingProfile) {
        try {
          setOnboardingProfileState(deserializeData(storedOnboardingProfile));
        } catch {
          setOnboardingProfileState(null);
        }
      }

      if (storedExercise) setExerciseEntries(deserializeData(storedExercise));
      if (storedIntake) setIntakeEntries(deserializeData(storedIntake));
      if (storedFocus) setFocusSessions(deserializeData(storedFocus));
      if (storedPeriodDays) setPeriodDays(deserializeData(storedPeriodDays));
      if (storedDayNotes) setDayNotes(deserializeData(storedDayNotes));
      if (storedAgeRange) setAgeRangeState(storedAgeRange as AgeRange);

      if (storedIntakeConfig) {
        try {
          setIntakeConfigState({ ...DEFAULT_INTAKE_CONFIG, ...JSON.parse(storedIntakeConfig) });
        } catch {
          setIntakeConfigState(DEFAULT_INTAKE_CONFIG);
        }
      }

      if (storedInsightSettings) {
        try {
          setInsightSettings({ ...DEFAULT_INSIGHT_SETTINGS, ...JSON.parse(storedInsightSettings) });
        } catch {
          setInsightSettings(DEFAULT_INSIGHT_SETTINGS);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = useCallback(async (key: string, data: any) => {
    if (!deviceStorageEnabled) {
      return;
    }
    try {
      await AsyncStorage.setItem(key, typeof data === "string" ? data : serializeData(data));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }, [deviceStorageEnabled]);

  const addSymptomEntry = useCallback((entry: Omit<SymptomEntry, "id" | "timestamp">, timestamp?: Date) => {
    const newEntry: SymptomEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };
    
    setSymptomEntries((prev) => {
      const updated = [newEntry, ...prev];
      saveToStorage(STORAGE_KEYS.symptomEntries, updated);
      return updated;
    });

    setUserStats((prev) => {
      const today = new Date();
      const lastEntry = prev.lastEntryDate;
      const isConsecutive = lastEntry && today.getTime() - new Date(lastEntry).getTime() < 86400000 * 2;
      const newStreak = isConsecutive ? prev.currentStreak + 1 : 1;
      const updated = {
        ...prev,
        totalEntries: prev.totalEntries + 1,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        xp: prev.xp + 25,
        level: Math.floor((prev.xp + 25) / 100) + 1,
        lastEntryDate: today,
      };
      saveToStorage(STORAGE_KEYS.userStats, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeSymptomEntry = useCallback((id: string) => {
    setSymptomEntries((prev) => {
      const updated = prev.filter((entry) => entry.id !== id);
      saveToStorage(STORAGE_KEYS.symptomEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addClipboardItem = useCallback((text: string) => {
    setClipboardItems((prev) => {
      const newItem = { id: Date.now().toString(), text, createdAt: new Date() };
      const updated = prev.length >= 5 ? [newItem, ...prev.slice(0, 4)] : [newItem, ...prev];
      saveToStorage(STORAGE_KEYS.clipboardItems, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeClipboardItem = useCallback((id: string) => {
    setClipboardItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEYS.clipboardItems, updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateClipboardItem = useCallback((id: string, text: string) => {
    setClipboardItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, text } : item));
      saveToStorage(STORAGE_KEYS.clipboardItems, updated);
      return updated;
    });
  }, [saveToStorage]);

  const reorderClipboardItems = useCallback((items: ClipboardItem[]) => {
    setClipboardItems(items);
    saveToStorage(STORAGE_KEYS.clipboardItems, items);
  }, [saveToStorage]);

  const addTodo = useCallback((text: string, dueDate?: Date) => {
    setTodos((prev) => {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date(),
        dueDate,
      };
      const updated = [newTodo, ...prev];
      saveToStorage(STORAGE_KEYS.todos, updated);
      return updated;
    });
  }, [saveToStorage]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: todo.completed ? undefined : new Date(),
            }
          : todo
      );
      saveToStorage(STORAGE_KEYS.todos, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = prev.filter((todo) => todo.id !== id);
      saveToStorage(STORAGE_KEYS.todos, updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateTodo = useCallback((id: string, text: string) => {
    setTodos((prev) => {
      const updated = prev.map((todo) => (todo.id === id ? { ...todo, text } : todo));
      saveToStorage(STORAGE_KEYS.todos, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addCalendarEvent = useCallback((event: Omit<CalendarEvent, "id">) => {
    setCalendarEvents((prev) => {
      const newEvent: CalendarEvent = { ...event, id: Date.now().toString() };
      const updated = [...prev, newEvent];
      saveToStorage(STORAGE_KEYS.calendarEvents, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeCalendarEvent = useCallback((id: string) => {
    setCalendarEvents((prev) => {
      const updated = prev.filter((event) => event.id !== id);
      saveToStorage(STORAGE_KEYS.calendarEvents, updated);
      return updated;
    });
  }, [saveToStorage]);

  const toggleCalendarEventComplete = useCallback((id: string) => {
    setCalendarEvents((prev) => {
      const updated = prev.map((event) =>
        event.id === id ? { ...event, completed: !event.completed } : event
      );
      saveToStorage(STORAGE_KEYS.calendarEvents, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addCustomTracker = useCallback((tracker: Omit<CustomTracker, "id">) => {
    setCustomTrackers((prev) => {
      const newTracker: CustomTracker = { ...tracker, id: Date.now().toString() };
      const updated = [...prev, newTracker];
      saveToStorage(STORAGE_KEYS.customTrackers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeCustomTracker = useCallback((id: string) => {
    setCustomTrackers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveToStorage(STORAGE_KEYS.customTrackers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const toggleCustomTracker = useCallback((id: string) => {
    setCustomTrackers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
      saveToStorage(STORAGE_KEYS.customTrackers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addCustomTrackerEntry = useCallback((trackerId: string, value: string | number | boolean) => {
    setCustomTrackerEntries((prev) => {
      const newEntry: CustomTrackerEntry = {
        id: Date.now().toString(),
        trackerId,
        value,
        timestamp: new Date(),
      };
      const updated = [newEntry, ...prev];
      saveToStorage(STORAGE_KEYS.customTrackerEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addQuickLogAction = useCallback((action: Omit<QuickLogAction, "id">) => {
    setQuickLogActions((prev) => {
      const newAction: QuickLogAction = { ...action, id: Date.now().toString() };
      const updated = [...prev, newAction];
      saveToStorage(STORAGE_KEYS.quickLogActions, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeQuickLogAction = useCallback((id: string) => {
    setQuickLogActions((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEYS.quickLogActions, updated);
      return updated;
    });
  }, [saveToStorage]);

  const toggleQuickLogAction = useCallback((id: string) => {
    setQuickLogActions((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
      saveToStorage(STORAGE_KEYS.quickLogActions, updated);
      return updated;
    });
  }, [saveToStorage]);

  const logQuickAction = useCallback((actionId: string) => {
    const action = quickLogActions.find((a) => a.id === actionId);
    if (!action) return;

    setQuickLogEntries((prev) => {
      const newEntry: QuickLogEntry = {
        id: Date.now().toString(),
        actionId,
        actionName: action.name,
        timestamp: new Date(),
      };
      const updated = [newEntry, ...prev];
      saveToStorage(STORAGE_KEYS.quickLogEntries, updated);
      return updated;
    });

    setUserStats((prev) => {
      const updated = {
        ...prev,
        xp: prev.xp + 10,
        level: Math.floor((prev.xp + 10) / 100) + 1,
      };
      saveToStorage(STORAGE_KEYS.userStats, updated);
      return updated;
    });
  }, [quickLogActions, saveToStorage]);

  const addQuickLogEntry = useCallback((actionName: string, timestamp?: Date) => {
    if (!actionName.trim()) return;
    setQuickLogEntries((prev) => {
      const newEntry: QuickLogEntry = {
        id: Date.now().toString(),
        actionId: "manual",
        actionName: actionName.trim(),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      };
      const updated = [newEntry, ...prev];
      saveToStorage(STORAGE_KEYS.quickLogEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeQuickLogEntry = useCallback((id: string) => {
    setQuickLogEntries((prev) => {
      const updated = prev.filter((entry) => entry.id !== id);
      saveToStorage(STORAGE_KEYS.quickLogEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addEmergencyContact = useCallback((contact: Omit<EmergencyContact, "id">) => {
    setEmergencyContacts((prev) => {
      const newContact: EmergencyContact = { ...contact, id: Date.now().toString() };
      const updated = [...prev, newContact];
      saveToStorage(STORAGE_KEYS.emergencyContacts, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeEmergencyContact = useCallback((id: string) => {
    setEmergencyContacts((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveToStorage(STORAGE_KEYS.emergencyContacts, updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateEmergencyContact = useCallback((id: string, contact: Partial<EmergencyContact>) => {
    setEmergencyContacts((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...contact } : c));
      saveToStorage(STORAGE_KEYS.emergencyContacts, updated);
      return updated;
    });
  }, [saveToStorage]);

  const setEmergencyMessage = useCallback((message: string) => {
    setEmergencyMessageState(message);
    saveToStorage(STORAGE_KEYS.emergencyMessage, message);
  }, [saveToStorage]);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    saveToStorage(STORAGE_KEYS.userName, name);
  }, [saveToStorage]);

  const setProfileImageUri = useCallback((uri: string | null) => {
    setProfileImageUriState(uri);
    saveToStorage(STORAGE_KEYS.profileImageUri, uri ?? "");
  }, [saveToStorage]);

  const setWidgetOrder = useCallback((order: WidgetId[]) => {
    setWidgetOrderState(order);
    saveToStorage(STORAGE_KEYS.widgetOrder, JSON.stringify(order));
  }, [saveToStorage]);

  const setGroupQuickLogs = useCallback((enabled: boolean) => {
    setGroupQuickLogsState(enabled);
    saveToStorage(STORAGE_KEYS.groupQuickLogs, enabled.toString());
  }, [saveToStorage]);

  const setGroupTodos = useCallback((enabled: boolean) => {
    setGroupTodosState(enabled);
    saveToStorage(STORAGE_KEYS.groupTodos, enabled.toString());
  }, [saveToStorage]);

  const setMedicalInfo = useCallback((info: MedicalInfo) => {
    setMedicalInfoState(info);
    saveToStorage(STORAGE_KEYS.medicalInfo, JSON.stringify(info));
  }, [saveToStorage]);

  const addCrisisScript = useCallback((script: Omit<CrisisScript, "id">) => {
    setCrisisScripts((prev) => {
      const newScript: CrisisScript = { ...script, id: Date.now().toString() };
      const updated = [...prev, newScript];
      saveToStorage(STORAGE_KEYS.crisisScripts, JSON.stringify(updated));
      return updated;
    });
  }, [saveToStorage]);

  const removeCrisisScript = useCallback((id: string) => {
    setCrisisScripts((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveToStorage(STORAGE_KEYS.crisisScripts, JSON.stringify(updated));
      return updated;
    });
  }, [saveToStorage]);

  const updateCrisisScript = useCallback((id: string, script: Partial<CrisisScript>) => {
    setCrisisScripts((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...script } : s));
      saveToStorage(STORAGE_KEYS.crisisScripts, JSON.stringify(updated));
      return updated;
    });
  }, [saveToStorage]);

  const setLowSensorySettings = useCallback((settings: LowSensorySettings) => {
    setLowSensorySettingsState(settings);
    saveToStorage(STORAGE_KEYS.lowSensorySettings, JSON.stringify(settings));
  }, [saveToStorage]);

  const addAlarmSchedule = useCallback((schedule: Omit<AlarmSchedule, "id" | "createdAt" | "notificationIds">) => {
    setAlarmSchedules((prev) => {
      const newSchedule: AlarmSchedule = {
        ...schedule,
        id: Date.now().toString(),
        createdAt: new Date(),
        notificationIds: [],
      };
      const updated = [...prev, newSchedule];
      saveToStorage(STORAGE_KEYS.alarmSchedules, updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateAlarmSchedule = useCallback((id: string, updates: Partial<AlarmSchedule>) => {
    setAlarmSchedules((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      saveToStorage(STORAGE_KEYS.alarmSchedules, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeAlarmSchedule = useCallback((id: string) => {
    setAlarmSchedules((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveToStorage(STORAGE_KEYS.alarmSchedules, updated);
      return updated;
    });
  }, [saveToStorage]);

  const toggleAlarmSchedule = useCallback((id: string) => {
    setAlarmSchedules((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
      saveToStorage(STORAGE_KEYS.alarmSchedules, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addCountdownTimer = useCallback((timer: Omit<CountdownTimer, "id">) => {
    setCountdownTimers((prev) => {
      const newTimer: CountdownTimer = { ...timer, id: Date.now().toString() };
      const updated = [...prev, newTimer];
      saveToStorage(STORAGE_KEYS.countdownTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateCountdownTimer = useCallback((id: string, timer: Partial<CountdownTimer>) => {
    setCountdownTimers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...timer } : t));
      saveToStorage(STORAGE_KEYS.countdownTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeCountdownTimer = useCallback((id: string) => {
    setCountdownTimers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveToStorage(STORAGE_KEYS.countdownTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addCountUpTimer = useCallback((timer: Omit<CountUpTimer, "id">) => {
    setCountUpTimers((prev) => {
      const newTimer: CountUpTimer = { ...timer, id: Date.now().toString() };
      const updated = [...prev, newTimer];
      saveToStorage(STORAGE_KEYS.countUpTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const updateCountUpTimer = useCallback((id: string, timer: Partial<CountUpTimer>) => {
    setCountUpTimers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...timer } : t));
      saveToStorage(STORAGE_KEYS.countUpTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeCountUpTimer = useCallback((id: string) => {
    setCountUpTimers((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveToStorage(STORAGE_KEYS.countUpTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const resetCountUpTimer = useCallback((id: string) => {
    setCountUpTimers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, startTime: new Date() } : t));
      saveToStorage(STORAGE_KEYS.countUpTimers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const setOnboardingComplete = useCallback(
    (complete: boolean) => {
      setOnboardingCompleteState(complete);
      saveToStorage(STORAGE_KEYS.onboardingComplete, complete.toString());
    },
    [saveToStorage],
  );

  const saveOnboardingProfile = useCallback(
    (profile: OnboardingProfile) => {
      setOnboardingProfileState(profile);
      saveToStorage(STORAGE_KEYS.onboardingProfile, profile);
      setOnboardingCompleteState(true);
      saveToStorage(STORAGE_KEYS.onboardingComplete, "true");
    },
    [saveToStorage],
  );

  const clearOnboardingProfile = useCallback(() => {
    setOnboardingProfileState(null);
    setOnboardingCompleteState(false);
    saveToStorage(STORAGE_KEYS.onboardingProfile, "null");
    saveToStorage(STORAGE_KEYS.onboardingComplete, "false");
  }, [saveToStorage]);

  const addExerciseEntry = useCallback(
    (entry: Omit<ExerciseEntry, "id" | "timestamp">, timestamp?: Date) => {
      setExerciseEntries((prev) => {
        const newEntry: ExerciseEntry = {
          ...entry,
          id: Date.now().toString(),
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        };
        const updated = [newEntry, ...prev];
        saveToStorage(STORAGE_KEYS.exerciseEntries, updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const removeExerciseEntry = useCallback((id: string) => {
    setExerciseEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveToStorage(STORAGE_KEYS.exerciseEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const addIntakeEntry = useCallback(
    (entry: Omit<IntakeEntry, "id" | "timestamp">, timestamp?: Date) => {
      setIntakeEntries((prev) => {
        const newEntry: IntakeEntry = {
          ...entry,
          id: Date.now().toString(),
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        };
        const updated = [newEntry, ...prev];
        saveToStorage(STORAGE_KEYS.intakeEntries, updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const removeIntakeEntry = useCallback((id: string) => {
    setIntakeEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveToStorage(STORAGE_KEYS.intakeEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const setIntakeConfig = useCallback((config: IntakeConfig) => {
    setIntakeConfigState(config);
    saveToStorage(STORAGE_KEYS.intakeConfig, JSON.stringify(config));
  }, [saveToStorage]);

  const addFocusSession = useCallback((minutes: number) => {
    setFocusSessions((prev) => {
      const session: FocusSession = { id: Date.now().toString(), endedAt: new Date(), minutes };
      const updated = [session, ...prev];
      saveToStorage(STORAGE_KEYS.focusSessions, updated);
      return updated;
    });
  }, [saveToStorage]);

  const setPeriodDay = useCallback((date: string, flow?: PeriodFlow) => {
    setPeriodDays((prev) => {
      const updated = [...prev.filter((d) => d.date !== date), { date, flow }].sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      saveToStorage(STORAGE_KEYS.periodDays, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removePeriodDay = useCallback((date: string) => {
    setPeriodDays((prev) => {
      const updated = prev.filter((d) => d.date !== date);
      saveToStorage(STORAGE_KEYS.periodDays, updated);
      return updated;
    });
  }, [saveToStorage]);

  const saveDayNotes = useCallback(
    (dates: string[], note: Omit<DayNote, "date" | "createdAt">) => {
      setDayNotes((prev) => {
        const dateSet = new Set(dates);
        const createdAt = new Date();
        const updated = [
          ...prev.filter((n) => !dateSet.has(n.date)),
          ...dates.map((date) => ({ ...note, date, createdAt })),
        ].sort((a, b) => a.date.localeCompare(b.date));
        saveToStorage(STORAGE_KEYS.dayNotes, updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  const setAgeRange = useCallback((range: AgeRange | null) => {
    setAgeRangeState(range);
    saveToStorage(STORAGE_KEYS.ageRange, range ?? "");
  }, [saveToStorage]);

  const updateInsightSettings = useCallback((changes: Partial<InsightSettings>) => {
    setInsightSettings((prev) => {
      const updated = { ...prev, ...changes };
      saveToStorage(STORAGE_KEYS.insightSettings, JSON.stringify(updated));
      return updated;
    });
  }, [saveToStorage]);

  const updateCustomTracker = useCallback((id: string, changes: Partial<CustomTracker>) => {
    setCustomTrackers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...changes } : t));
      saveToStorage(STORAGE_KEYS.customTrackers, updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeCustomTrackerEntry = useCallback((id: string) => {
    setCustomTrackerEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveToStorage(STORAGE_KEYS.customTrackerEntries, updated);
      return updated;
    });
  }, [saveToStorage]);

  const loadDemoData = useCallback((data: DemoDataBundle) => {
    setSymptomEntries(data.symptomEntries);
    setQuickLogActions(data.quickLogActions);
    setQuickLogEntries(data.quickLogEntries);
    setTodos(data.todos);
    setCalendarEvents(data.calendarEvents);
    setExerciseEntries(data.exerciseEntries);
    setIntakeEntries(data.intakeEntries);
    setFocusSessions(data.focusSessions);
    setPeriodDays(data.periodDays);
    setCustomTrackers(data.customTrackers);
    setCustomTrackerEntries(data.customTrackerEntries);
    saveToStorage(STORAGE_KEYS.symptomEntries, data.symptomEntries);
    saveToStorage(STORAGE_KEYS.quickLogActions, data.quickLogActions);
    saveToStorage(STORAGE_KEYS.quickLogEntries, data.quickLogEntries);
    saveToStorage(STORAGE_KEYS.todos, data.todos);
    saveToStorage(STORAGE_KEYS.calendarEvents, data.calendarEvents);
    saveToStorage(STORAGE_KEYS.exerciseEntries, data.exerciseEntries);
    saveToStorage(STORAGE_KEYS.intakeEntries, data.intakeEntries);
    saveToStorage(STORAGE_KEYS.focusSessions, data.focusSessions);
    saveToStorage(STORAGE_KEYS.periodDays, data.periodDays);
    saveToStorage(STORAGE_KEYS.customTrackers, data.customTrackers);
    saveToStorage(STORAGE_KEYS.customTrackerEntries, data.customTrackerEntries);
  }, [saveToStorage]);

  return (
    <DataContext.Provider
      value={{
        symptomEntries,
        addSymptomEntry,
        removeSymptomEntry,
        clipboardItems,
        addClipboardItem,
        removeClipboardItem,
        updateClipboardItem,
        reorderClipboardItems,
        todos,
        addTodo,
        toggleTodo,
        removeTodo,
        updateTodo,
        calendarEvents,
        addCalendarEvent,
        removeCalendarEvent,
        toggleCalendarEventComplete,
        customTrackers,
        addCustomTracker,
        removeCustomTracker,
        toggleCustomTracker,
        customTrackerEntries,
        addCustomTrackerEntry,
        quickLogActions,
        addQuickLogAction,
        removeQuickLogAction,
        toggleQuickLogAction,
        quickLogEntries,
        logQuickAction,
        addQuickLogEntry,
        removeQuickLogEntry,
        emergencyContacts,
        addEmergencyContact,
        removeEmergencyContact,
        updateEmergencyContact,
        emergencyMessage,
        setEmergencyMessage,
        medicalInfo,
        setMedicalInfo,
        crisisScripts,
        addCrisisScript,
        removeCrisisScript,
        updateCrisisScript,
        alarmSchedules,
        addAlarmSchedule,
        updateAlarmSchedule,
        removeAlarmSchedule,
        toggleAlarmSchedule,
        userStats,
        userName,
        setUserName,
        profileImageUri,
        setProfileImageUri,
        widgetOrder,
        setWidgetOrder,
        lowSensorySettings,
        setLowSensorySettings,
        countdownTimers,
        addCountdownTimer,
        updateCountdownTimer,
        removeCountdownTimer,
        countUpTimers,
        addCountUpTimer,
        updateCountUpTimer,
        removeCountUpTimer,
        resetCountUpTimer,
        groupQuickLogs,
        setGroupQuickLogs,
        groupTodos,
        setGroupTodos,
        onboardingComplete,
        setOnboardingComplete,
        onboardingProfile,
        saveOnboardingProfile,
        clearOnboardingProfile,
        deviceStorageEnabled,
        setDeviceStorageEnabled,
        clearAllDeviceData,
        dataResetCount,
        exerciseEntries,
        addExerciseEntry,
        removeExerciseEntry,
        intakeEntries,
        addIntakeEntry,
        removeIntakeEntry,
        intakeConfig,
        setIntakeConfig,
        focusSessions,
        addFocusSession,
        periodDays,
        setPeriodDay,
        removePeriodDay,
        dayNotes,
        saveDayNotes,
        ageRange,
        setAgeRange,
        insightSettings,
        updateInsightSettings,
        updateCustomTracker,
        removeCustomTrackerEntry,
        loadDemoData,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
