import React, { createContext, useContext, useState, ReactNode } from "react";

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

interface DataContextType {
  symptomEntries: SymptomEntry[];
  addSymptomEntry: (entry: Omit<SymptomEntry, "id" | "timestamp">) => void;
  clipboardItems: ClipboardItem[];
  addClipboardItem: (text: string) => void;
  removeClipboardItem: (id: string) => void;
  updateClipboardItem: (id: string, text: string) => void;
  reorderClipboardItems: (items: ClipboardItem[]) => void;
  userStats: UserStats;
  insights: PatternInsight[];
  userName: string;
  setUserName: (name: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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

export function DataProvider({ children }: { children: ReactNode }) {
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>(SAMPLE_ENTRIES);
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    ...INITIAL_STATS,
    totalEntries: SAMPLE_ENTRIES.length,
    currentStreak: 6,
    longestStreak: 6,
    xp: 150,
    level: 2,
  });
  const [insights] = useState<PatternInsight[]>(DEFAULT_INSIGHTS);
  const [userName, setUserName] = useState("");

  const addSymptomEntry = (entry: Omit<SymptomEntry, "id" | "timestamp">) => {
    const newEntry: SymptomEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setSymptomEntries((prev) => [newEntry, ...prev]);

    const today = new Date();
    const lastEntry = userStats.lastEntryDate;
    const isConsecutive =
      lastEntry &&
      today.getTime() - lastEntry.getTime() < 86400000 * 2;

    setUserStats((prev) => {
      const newStreak = isConsecutive ? prev.currentStreak + 1 : 1;
      return {
        ...prev,
        totalEntries: prev.totalEntries + 1,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        xp: prev.xp + 25,
        level: Math.floor((prev.xp + 25) / 100) + 1,
        lastEntryDate: today,
      };
    });
  };

  const addClipboardItem = (text: string) => {
    if (clipboardItems.length >= 5) {
      setClipboardItems((prev) => [
        { id: Date.now().toString(), text, createdAt: new Date() },
        ...prev.slice(0, 4),
      ]);
    } else {
      setClipboardItems((prev) => [
        { id: Date.now().toString(), text, createdAt: new Date() },
        ...prev,
      ]);
    }
  };

  const removeClipboardItem = (id: string) => {
    setClipboardItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateClipboardItem = (id: string, text: string) => {
    setClipboardItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const reorderClipboardItems = (items: ClipboardItem[]) => {
    setClipboardItems(items);
  };

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
        userStats,
        insights,
        userName,
        setUserName,
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
