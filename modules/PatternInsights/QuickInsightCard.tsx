import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function QuickInsightCard() {
  const { theme } = useTheme();
  const { insights } = useData();

  const topInsight = insights[0];

  if (!topInsight) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surfaceVariant }]}>
          <Feather name="zap" size={18} color={theme.accent} />
        </View>
        <ThemedText type="h4" style={styles.title}>
          Quick Insight
        </ThemedText>
      </View>

      <View
        style={[
          styles.insightContent,
          { backgroundColor: theme.surfaceVariant, borderLeftColor: theme.accent },
        ]}
      >
        <Feather name={topInsight.icon as any} size={20} color={theme.accent} />
        <View style={styles.textContainer}>
          <ThemedText type="body" style={styles.insightTitle}>
            {topInsight.title}
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.insightDescription, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {topInsight.description}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "600",
  },
  insightContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    gap: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  insightTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    opacity: 0.8,
    lineHeight: 18,
  },
});
