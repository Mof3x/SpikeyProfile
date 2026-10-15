import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PatternInsight } from "@/core/DataContext";
import { useAnalytics } from "@/core/AnalyticsContext";

interface InsightCardProps {
  insight: PatternInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const { theme } = useTheme();
  const { wordsFor } = useAnalytics();
  const [expanded, setExpanded] = useState(false);

  const getTypeColor = () => {
    switch (insight.type) {
      case "positive":
        return theme.success;
      case "warning":
        return theme.accent;
      default:
        return theme.primary;
    }
  };

  const typeColor = getTypeColor();

  const handlePress = () => {
    Haptics.selectionAsync();
    setExpanded((prev) => !prev);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityHint={
        expanded ? "Hides where this comes from" : "Shows where this comes from"
      }
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.surfaceVariant,
          borderLeftColor: typeColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Feather name={insight.icon as any} size={24} color={typeColor} />
      </View>
      <ThemedText type="body" style={styles.title} numberOfLines={1}>
        {insight.title}
      </ThemedText>
      <ThemedText
        type="small"
        style={[styles.description, { color: theme.textSecondary }]}
        numberOfLines={expanded ? undefined : 3}
      >
        {wordsFor(insight)}
      </ThemedText>
      {expanded && insight.basis ? (
        <View style={[styles.basis, { borderTopColor: theme.divider }]}>
          <Feather name="info" size={12} color={theme.textSecondary} />
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, flex: 1 }}
          >
            {insight.basis}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    minHeight: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  description: {
    opacity: 0.8,
    lineHeight: 18,
  },
  basis: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
});
