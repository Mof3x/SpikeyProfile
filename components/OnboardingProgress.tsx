import React from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface OnboardingProgressProps {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
}

export function OnboardingProgress({
  step,
  total,
  title,
  subtitle,
}: OnboardingProgressProps) {
  const { theme } = useTheme();
  const progress = Math.max(0, Math.min(1, step / total));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Step {step} of {total}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {Math.round(progress * 100)}%
        </ThemedText>
      </View>

      <View style={[styles.track, { backgroundColor: theme.surfaceVariant }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: theme.primary, width: `${progress * 100}%` },
          ]}
        />
      </View>

      <ThemedText type="h3" style={styles.title}>
        {title}
      </ThemedText>

      {subtitle ? (
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    width: "100%",
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  title: {
    marginTop: Spacing.xs,
  },
});
