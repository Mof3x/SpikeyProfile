import React, { useState } from "react";
import { StyleSheet, View, Pressable, ScrollView, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

import { SpikyChart } from "@/modules/SpikyChart/SpikyChart";
import { InsightCard } from "@/modules/PatternInsights/InsightCard";

type TimeRange = "week" | "month";

export default function InsightsScreen() {
  const { theme } = useTheme();
  const { isModuleEnabled } = useModules();
  const { symptomEntries, insights } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const handleRangeChange = (range: TimeRange) => {
    Haptics.selectionAsync();
    setTimeRange(range);
  };

  const chartEnabled = isModuleEnabled("spikyChart");
  const insightsEnabled = isModuleEnabled("patternInsights");

  if (!chartEnabled && !insightsEnabled) {
    return (
      <ScreenScrollView contentContainerStyle={styles.disabledContainer}>
        <Feather name="bar-chart-2" size={48} color={theme.textSecondary} />
        <Spacer height={Spacing.lg} />
        <ThemedText type="h3" style={styles.disabledTitle}>
          Insights Modules Disabled
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.disabledText, { color: theme.textSecondary }]}
        >
          Enable the Spiky Chart or Pattern Insights module in Settings.
        </ThemedText>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.rangeSelector}>
        <Pressable
          onPress={() => handleRangeChange("week")}
          style={[
            styles.rangeButton,
            {
              backgroundColor:
                timeRange === "week" ? theme.primary : theme.surfaceVariant,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={[
              styles.rangeText,
              { color: timeRange === "week" ? "#FFFFFF" : theme.text },
            ]}
          >
            Week
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => handleRangeChange("month")}
          style={[
            styles.rangeButton,
            {
              backgroundColor:
                timeRange === "month" ? theme.primary : theme.surfaceVariant,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={[
              styles.rangeText,
              { color: timeRange === "month" ? "#FFFFFF" : theme.text },
            ]}
          >
            Month
          </ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.xl} />

      {chartEnabled && (
        <>
          <View
            style={[styles.chartContainer, { backgroundColor: theme.surface }]}
          >
            <ThemedText type="h4" style={styles.chartTitle}>
              Your Spiky Profile
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.chartSubtitle, { color: theme.textSecondary }]}
            >
              Cognitive peaks and valleys over time
            </ThemedText>
            <Spacer height={Spacing.lg} />
            <SpikyChart entries={symptomEntries} timeRange={timeRange} />
          </View>
          <Spacer height={Spacing.xl} />
        </>
      )}

      {insightsEnabled && (
        <>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Pattern Insights
          </ThemedText>
          <Spacer height={Spacing.md} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsScroll}
          >
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </ScrollView>
        </>
      )}

      <Spacer height={Spacing["5xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  rangeSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  rangeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  rangeText: {
    fontWeight: "600",
  },
  chartContainer: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.lg,
  },
  chartTitle: {
    marginBottom: Spacing.xs,
  },
  chartSubtitle: {
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  insightsScroll: {
    paddingRight: Spacing.xl,
    gap: Spacing.lg,
  },
  disabledContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  disabledTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  disabledText: {
    textAlign: "center",
    opacity: 0.7,
  },
});
