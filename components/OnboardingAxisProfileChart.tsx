import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { BarChart } from "react-native-chart-kit";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { OnboardingAxisId } from "@/core/DataContext";
import { ONBOARDING_AXIS_LABELS } from "@/core/OnboardingFlowContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const AXIS_ORDER: OnboardingAxisId[] = [
  "patternRecognition",
  "deepFocus",
  "creativity",
  "principledJudgement",
  "executiveFunction",
  "healthWellbeingSafety",
  "sensoryRegulation",
  "mobilityNavigationSocial",
];

interface OnboardingAxisProfileChartProps {
  scores: Record<OnboardingAxisId, number>;
}

export function OnboardingAxisProfileChart({
  scores,
}: OnboardingAxisProfileChartProps) {
  const { theme } = useTheme();
  const chartWidth = Math.max(
    320,
    Dimensions.get("window").width - Spacing.xl * 2 - Spacing.cardPadding * 2,
  );

  return (
    <Card style={styles.card}>
      <ThemedText type="h4">8-area profile snapshot</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        You can edit this later in onboarding settings.
      </ThemedText>

      <View style={styles.chartWrap}>
        <BarChart
          data={{
            labels: AXIS_ORDER.map(
              (axisId) => ONBOARDING_AXIS_LABELS[axisId].split(" ")[0],
            ),
            datasets: [
              {
                data: AXIS_ORDER.map((axisId) => scores[axisId]),
              },
            ],
          }}
          width={chartWidth}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          fromZero
          showValuesOnTopOfBars
          chartConfig={{
            backgroundColor: "transparent",
            backgroundGradientFrom: theme.surface,
            backgroundGradientTo: theme.surface,
            decimalPlaces: 0,
            barPercentage: 0.6,
            color: () => theme.primary,
            labelColor: () => theme.textSecondary,
          }}
          style={styles.chart}
        />
      </View>

      <View style={styles.legend}>
        {AXIS_ORDER.map((axisId) => (
          <View key={axisId} style={styles.legendRow}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {ONBOARDING_AXIS_LABELS[axisId]}
            </ThemedText>
            <ThemedText type="caption" style={{ fontWeight: "600" }}>
              {scores[axisId]}/5
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  chartWrap: {
    overflow: "hidden",
  },
  chart: {
    marginLeft: -Spacing.lg,
  },
  legend: {
    gap: Spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
