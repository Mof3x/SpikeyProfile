import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState, InteractionManager } from "react-native";

import {
  EMPTY_ANALYTICS,
  runAnalytics,
  type AnalyticsResult,
} from "@/core/analytics";
import { useInsightNotifications } from "@/core/analytics/scheduler";
import { useData } from "@/core/DataContext";
import { useSources } from "@/core/sources/SourcesContext";

interface Wordable {
  plain?: string;
  numbers?: string;
  description?: string;
}

interface AnalyticsContextValue {
  result: AnalyticsResult;
  /** True while a fresh analysis is being worked out. */
  updating: boolean;
  showNumbers: boolean;
  setShowNumbers: (value: boolean) => void;
  /** The plain-words or numbers version, following the "Show the numbers" setting. */
  wordsFor: (item: Wordable) => string;
}

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(
  undefined,
);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const { external } = useSources();
  const [result, setResult] = useState<AnalyticsResult>(EMPTY_ANALYTICS);
  const [updating, setUpdating] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  // Re-run when the app comes back to the foreground (the day may have changed) and every half hour.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setClock(Date.now());
    });
    const timer = setInterval(() => setClock(Date.now()), 30 * 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const input = useMemo(
    () => ({
      now: new Date(clock),
      symptomEntries: data.symptomEntries,
      quickLogActions: data.quickLogActions,
      quickLogEntries: data.quickLogEntries,
      todos: data.todos,
      calendarEvents: data.calendarEvents,
      countdownTimers: data.countdownTimers,
      customTrackers: data.customTrackers,
      customTrackerEntries: data.customTrackerEntries,
      exerciseEntries: data.exerciseEntries,
      intakeEntries: data.intakeEntries,
      intakeConfig: data.intakeConfig,
      focusSessions: data.focusSessions,
      periodDays: data.periodDays,
      dayNotes: data.dayNotes,
      ageRange: data.ageRange,
      external,
    }),
    [
      clock,
      data.symptomEntries,
      data.quickLogActions,
      data.quickLogEntries,
      data.todos,
      data.calendarEvents,
      data.countdownTimers,
      data.customTrackers,
      data.customTrackerEntries,
      data.exerciseEntries,
      data.intakeEntries,
      data.intakeConfig,
      data.focusSessions,
      data.periodDays,
      data.dayNotes,
      data.ageRange,
      external,
    ],
  );

  useEffect(() => {
    if (data.isLoading) return;
    let cancelled = false;
    setUpdating(true);
    // Wait for taps and animations to finish so logging always feels instant.
    const task = InteractionManager.runAfterInteractions(() => {
      try {
        const next = runAnalytics(input);
        if (!cancelled) setResult(next);
      } catch (error) {
        console.error("Analysis failed:", error);
      } finally {
        if (!cancelled) setUpdating(false);
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [input, data.isLoading]);

  useInsightNotifications(
    result,
    data.insightSettings,
    data.lowSensorySettings,
    data.saveDayNotes,
  );

  const showNumbers = data.insightSettings.showNumbers;
  const { updateInsightSettings } = data;
  const setShowNumbers = useCallback(
    (value: boolean) => updateInsightSettings({ showNumbers: value }),
    [updateInsightSettings],
  );
  const wordsFor = useCallback(
    (item: Wordable) =>
      showNumbers && item.numbers
        ? item.numbers
        : (item.plain ?? item.description ?? ""),
    [showNumbers],
  );

  // The "feeling better, so the meds slip" heads-up only shows when it's switched on in Settings.
  const medSlipOn = data.insightSettings.medSlipHeadsUp;
  const visible = useMemo(
    () =>
      medSlipOn
        ? result
        : {
            ...result,
            insights: result.insights.filter(
              (i) => !i.id.startsWith("drift.live."),
            ),
          },
    [result, medSlipOn],
  );

  const value = useMemo(
    () => ({
      result: visible,
      updating,
      showNumbers,
      setShowNumbers,
      wordsFor,
    }),
    [visible, updating, showNumbers, setShowNumbers, wordsFor],
  );
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context)
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  return context;
}
