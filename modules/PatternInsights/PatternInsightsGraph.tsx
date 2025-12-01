import React, { useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const screenWidth = Dimensions.get("window").width;

interface CorrelationData {
  factor1: string;
  factor2: string;
  correlation: number;
  description: string;
}

export function PatternInsightsGraph() {
  const { theme } = useTheme();
  const { symptomEntries, quickLogEntries } = useData();

  const correlations: CorrelationData[] = useMemo(() => {
    const mockCorrelations: CorrelationData[] = [
      {
        factor1: "Sleep",
        factor2: "Energy",
        correlation: 0.72,
        description: "Better sleep tends to improve energy levels",
      },
      {
        factor1: "Medication",
        factor2: "Focus",
        correlation: 0.65,
        description: "Consistent meds may help with focus",
      },
      {
        factor1: "Exercise",
        factor2: "Mood",
        correlation: 0.58,
        description: "Activity seems linked to better mood",
      },
      {
        factor1: "Screen Time",
        factor2: "Brain Fog",
        correlation: -0.45,
        description: "More screens may increase brain fog",
      },
      {
        factor1: "Hydration",
        factor2: "Energy",
        correlation: 0.42,
        description: "Staying hydrated might boost energy",
      },
    ];

    return mockCorrelations;
  }, [symptomEntries, quickLogEntries]);

  const chartData = {
    labels: correlations.map((c) => c.factor1.slice(0, 6)),
    datasets: [
      {
        data: correlations.map((c) => c.correlation * 100),
      },
    ],
  };

  const getCorrelationColor = (value: number) => {
    if (value >= 0.6) return theme.success;
    if (value >= 0.4) return theme.primary;
    if (value >= 0) return theme.accent;
    return theme.error;
  };

  const getCorrelationLabel = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return "Strong";
    if (absValue >= 0.5) return "Moderate";
    if (absValue >= 0.3) return "Weak";
    return "Minimal";
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="git-branch" size={18} color={theme.primary} />
          </View>
          <View>
            <ThemedText type="h3">Pattern Correlations</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              How your habits connect
            </ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          width={screenWidth - Spacing.lg * 2 - Spacing.cardPadding * 2}
          height={160}
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: "transparent",
            backgroundGradientFrom: theme.surface,
            backgroundGradientTo: theme.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => theme.primary,
            labelColor: () => theme.textSecondary,
            style: {
              borderRadius: BorderRadius.md,
            },
            barPercentage: 0.6,
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: theme.divider,
              strokeWidth: 1,
            },
          }}
          style={styles.chart}
          fromZero
          showValuesOnTopOfBars
          withInnerLines={false}
        />
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      <Spacer height={Spacing.lg} />

      <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
        Discovered Patterns
      </ThemedText>

      {correlations.slice(0, 3).map((item, index) => (
        <View
          key={index}
          style={[
            styles.correlationItem,
            index > 0 && { marginTop: Spacing.md },
            { backgroundColor: theme.surfaceVariant },
          ]}
        >
          <View style={styles.correlationHeader}>
            <View style={styles.factorPair}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {item.factor1}
              </ThemedText>
              <Feather
                name={item.correlation >= 0 ? "arrow-right" : "arrow-left"}
                size={14}
                color={theme.textSecondary}
                style={{ marginHorizontal: Spacing.xs }}
              />
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {item.factor2}
              </ThemedText>
            </View>
            <View
              style={[
                styles.correlationBadge,
                { backgroundColor: getCorrelationColor(item.correlation) + "20" },
              ]}
            >
              <ThemedText
                type="caption"
                style={{ color: getCorrelationColor(item.correlation), fontWeight: "600" }}
              >
                {getCorrelationLabel(item.correlation)}
              </ThemedText>
            </View>
          </View>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
          >
            {item.description}
          </ThemedText>
          <View style={[styles.correlationBar, { backgroundColor: theme.divider }]}>
            <View
              style={[
                styles.correlationFill,
                {
                  width: `${Math.abs(item.correlation) * 100}%`,
                  backgroundColor: getCorrelationColor(item.correlation),
                },
              ]}
            />
          </View>
        </View>
      ))}

      <Spacer height={Spacing.md} />

      <View style={[styles.infoBox, { backgroundColor: theme.primary + "10" }]}>
        <Feather name="info" size={14} color={theme.primary} />
        <ThemedText type="caption" style={{ color: theme.primary, marginLeft: Spacing.sm, flex: 1 }}>
          These patterns are based on your tracked data. Keep logging to discover more connections!
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.cardPadding,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chartWrapper: {
    alignItems: "center",
  },
  chart: {
    borderRadius: BorderRadius.md,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  correlationItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  correlationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  factorPair: {
    flexDirection: "row",
    alignItems: "center",
  },
  correlationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  correlationBar: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: "hidden",
  },
  correlationFill: {
    height: "100%",
    borderRadius: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
