import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { SymptomEntry } from "@/core/DataContext";

interface SpikyChartProps {
  entries: SymptomEntry[];
  timeRange: "week" | "month";
}

export function SpikyChart({ entries, timeRange }: SpikyChartProps) {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width - Spacing.xl * 2 - Spacing.cardPadding * 2;

  const daysToShow = timeRange === "week" ? 7 : 30;
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000);

  const filteredEntries = entries
    .filter((e) => e.timestamp >= cutoffDate)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (filteredEntries.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText
          type="body"
          style={[styles.emptyText, { color: theme.textSecondary }]}
        >
          Not enough data to display chart. Log at least 2 entries.
        </ThemedText>
      </View>
    );
  }

  const labels = filteredEntries.map((e) =>
    e.timestamp.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)
  );

  const moodData = filteredEntries.map((e) => e.mood);
  const energyData = filteredEntries.map((e) => e.energy);
  const fogData = filteredEntries.map((e) => 11 - e.brainFog);

  const chartConfig = {
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 159, 204, ${opacity})`,
    labelColor: () => theme.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: theme.divider,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: labels.length > 7 ? labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0) : labels,
          datasets: [
            {
              data: moodData,
              color: () => theme.primary,
              strokeWidth: 2,
            },
            {
              data: energyData,
              color: () => theme.secondary,
              strokeWidth: 2,
            },
            {
              data: fogData,
              color: () => theme.accent,
              strokeWidth: 2,
            },
          ],
          legend: ["Mood", "Energy", "Clarity"],
        }}
        width={screenWidth}
        height={200}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero
        yAxisInterval={2}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Mood
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.secondary }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Energy
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Clarity
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  chart: {
    marginLeft: -Spacing.lg,
    borderRadius: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
});
