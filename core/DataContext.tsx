import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SymptomEntry {
  id: string;
  timestamp: Date;
  mood: number;
  energy: number;
  brainFog: number;
  sensoryOverload: number;
  executiveDysfunction: number;
  notes?: string;
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
  "clipboardTray",
  "patternInsights",
  "emergency",
];

interface DataContextType {
  symptomEntries: SymptomEntry[];
  addSymptomEntry: (entry: Omit<SymptomEntry, "id" | "timestamp">) => void;
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
  insights: PatternInsight[];
  userName: string;
  setUserName: (name: string) => void;
  widgetOrder: WidgetId[];
  setWidgetOrder: (order: WidgetId[]) => void;
  lowSensorySettings: LowSensorySettings;
  setLowSensorySettings: (settings: LowSensorySettings) => void;
  isLoading: boolean;
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
  widgetOrder: "@spikeyprofile/widgetOrder",
  medicalInfo: "@spikeyprofile/medicalInfo",
  crisisScripts: "@spikeyprofile/crisisScripts",
  lowSensorySettings: "@spikeyprofile/lowSensorySettings",
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

const SAMPLE_ENTRIES: SymptomEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 86400000 * 6),
    mood: 7,
    energy: 5,
    brainFog: 3,
    sensoryOverload: 2,
    executiveDysfunction: 4,
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 86400000 * 5),
    mood: 6,
    energy: 4,
    brainFog: 5,
    sensoryOverload: 4,
    executiveDysfunction: 6,
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 86400000 * 4),
    mood: 8,
    energy: 7,
    brainFog: 2,
    sensoryOverload: 2,
    executiveDysfunction: 3,
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 86400000 * 3),
    mood: 5,
    energy: 3,
    brainFog: 7,
    sensoryOverload: 6,
    executiveDysfunction: 7,
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 86400000 * 2),
    mood: 6,
    energy: 5,
    brainFog: 4,
    sensoryOverload: 3,
    executiveDysfunction: 5,
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 86400000),
    mood: 7,
    energy: 6,
    brainFog: 3,
    sensoryOverload: 2,
    executiveDysfunction: 4,
  },
];

const DEFAULT_QUICK_LOG_ACTIONS: QuickLogAction[] = [
  { id: "1", name: "Morning Meds", icon: "sun", category: "medication", enabled: true },
  { id: "2", name: "Evening Meds", icon: "moon", category: "medication", enabled: true },
  { id: "3", name: "Drank Water", icon: "droplet", category: "habit", enabled: true },
  { id: "4", name: "Took a Break", icon: "coffee", category: "habit", enabled: true },
  { id: "5", name: "Went Outside", icon: "wind", category: "habit", enabled: true },
];

const DEFAULT_INSIGHTS: PatternInsight[] = [
  {
    id: "1",
    title: "Energy Pattern",
    description: "Your energy tends to be higher in the morning. Consider scheduling demanding tasks before noon.",
    icon: "battery-charging",
    type: "positive",
  },
  {
    id: "2",
    title: "Sensory Sensitivity",
    description: "Lower sensory overload on days with better sleep. A weighted blanket might help.",
    icon: "moon",
    type: "neutral",
  },
  {
    id: "3",
    title: "Focus Correlation",
    description: "Brain fog increases when you skip breaks. Try the Pomodoro technique.",
    icon: "clock",
    type: "warning",
  },
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
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>(SAMPLE_ENTRIES);
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
  const [userStats, setUserStats] = useState<UserStats>({
    ...INITIAL_STATS,
    totalEntries: SAMPLE_ENTRIES.length,
    currentStreak: 6,
    longestStreak: 6,
    xp: 150,
    level: 2,
  });
  const [insights] = useState<PatternInsight[]>(DEFAULT_INSIGHTS);
  const [userName, setUserNameState] = useState("");
  const [widgetOrder, setWidgetOrderState] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
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
        storedWidgetOrder,
        storedMedicalInfo,
        storedCrisisScripts,
        storedLowSensory,
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
        AsyncStorage.getItem(STORAGE_KEYS.widgetOrder),
        AsyncStorage.getItem(STORAGE_KEYS.medicalInfo),
        AsyncStorage.getItem(STORAGE_KEYS.crisisScripts),
        AsyncStorage.getItem(STORAGE_KEYS.lowSensorySettings),
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
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = useCallback(async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, typeof data === "string" ? data : serializeData(data));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  }, []);

  const addSymptomEntry = useCallback((entry: Omit<SymptomEntry, "id" | "timestamp">) => {
    const newEntry: SymptomEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
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
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
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

  const setWidgetOrder = useCallback((order: WidgetId[]) => {
    setWidgetOrderState(order);
    saveToStorage(STORAGE_KEYS.widgetOrder, JSON.stringify(order));
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

  return (
    <DataContext.Provider
      value={{
        symptomEntries,
        addSymptomEntry,
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
        insights,
        userName,
        setUserName,
        widgetOrder,
        setWidgetOrder,
        lowSensorySettings,
        setLowSensorySettings,
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
