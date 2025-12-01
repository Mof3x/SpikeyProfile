import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

import { GamificationCard } from "@/modules/Gamification/GamificationCard";
import { TodaySummaryCard } from "@/modules/SymptomTracker/TodaySummaryCard";
import { ClipboardPreview } from "@/modules/ClipboardTray/ClipboardPreview";
import { QuickInsightCard } from "@/modules/PatternInsights/QuickInsightCard";
import { NFCQuickTap } from "@/modules/NFCModule/NFCQuickTap";

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
    return e.timestamp.toDateString() === today.toDateString();
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
            ? "You've logged your symptoms today"
            : "How are you feeling today?"}
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      {isModuleEnabled("gamification") && (
        <>
          <GamificationCard />
          <Spacer height={Spacing.lg} />
        </>
      )}

      {isModuleEnabled("symptomTracker") && (
        <>
          <TodaySummaryCard entry={todayEntry} />
          <Spacer height={Spacing.lg} />
        </>
      )}

      {isModuleEnabled("clipboardTray") && (
        <>
          <ClipboardPreview />
          <Spacer height={Spacing.lg} />
        </>
      )}

      {isModuleEnabled("patternInsights") && (
        <>
          <QuickInsightCard />
          <Spacer height={Spacing.lg} />
        </>
      )}

      {isModuleEnabled("nfcModule") && (
        <>
          <NFCQuickTap />
          <Spacer height={Spacing.lg} />
        </>
      )}

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
