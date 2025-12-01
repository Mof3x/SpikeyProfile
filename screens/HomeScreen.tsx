import React from "react";
import { StyleSheet, View } from "react-native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing } from "@/constants/theme";

import { GamificationCard } from "@/modules/Gamification/GamificationCard";
import { TodaySummaryCard } from "@/modules/SymptomTracker/TodaySummaryCard";
import { ClipboardPreview } from "@/modules/ClipboardTray/ClipboardPreview";
import { QuickInsightCard } from "@/modules/PatternInsights/QuickInsightCard";
import { TodoWidget } from "@/modules/TodoList/TodoWidget";
import { UpcomingEventsWidget } from "@/modules/Calendar/UpcomingEventsWidget";
import { NFCQuickLogCard } from "@/modules/NFCModule/NFCQuickLog";
import { PomodoroTimerCard } from "@/modules/Pomodoro/PomodoroTimer";
import { EmergencyButtonCard } from "@/modules/Emergency/EmergencyButton";

export default function HomeScreen() {
  const { theme } = useTheme();
  const { isModuleEnabled } = useModules();
  const { userName, symptomEntries } = useData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const displayName = userName || "there";
  const todayEntry = symptomEntries.find((e) => {
    const today = new Date();
    const entryDate = new Date(e.timestamp);
    return entryDate.toDateString() === today.toDateString();
  });

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2" style={styles.greeting}>
          {getGreeting()}, {displayName}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          {todayEntry
            ? "You've logged today. How's it going?"
            : "Ready to check in?"}
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      {isModuleEnabled("gamification") ? (
        <>
          <GamificationCard />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("symptomTracker") ? (
        <>
          <TodaySummaryCard entry={todayEntry} />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("todoList") ? (
        <>
          <TodoWidget />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("calendar") ? (
        <>
          <UpcomingEventsWidget />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("nfcModule") ? (
        <>
          <NFCQuickLogCard />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("pomodoro") ? (
        <>
          <PomodoroTimerCard />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("clipboardTray") ? (
        <>
          <ClipboardPreview />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("patternInsights") ? (
        <>
          <QuickInsightCard />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {isModuleEnabled("emergency") ? (
        <>
          <EmergencyButtonCard />
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.8,
  },
});
