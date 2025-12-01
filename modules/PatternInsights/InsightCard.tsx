import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { PatternInsight } from "@/core/DataContext";

interface InsightCardProps {
  insight: PatternInsight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const { theme } = useTheme();

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
  };

  return (
    <Pressable
      onPress={handlePress}
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
        numberOfLines={2}
      >
        {insight.description}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: 140,
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
});
