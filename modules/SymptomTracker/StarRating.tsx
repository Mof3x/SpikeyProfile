import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface StarRatingProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: number;
  onValueChange: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  compact?: boolean;
}

export function StarRating({
  label,
  icon,
  value,
  onValueChange,
  lowLabel = "Poor",
  highLabel = "Great",
  compact = false,
}: StarRatingProps) {
  const { theme } = useTheme();
  const maxStars = 5;
  const numStars = Math.ceil((value / 10) * maxStars);

  const handlePress = (index: number) => {
    Haptics.selectionAsync();
    const newValue = Math.round(((index + 1) / maxStars) * 10);
    onValueChange(newValue);
  };

  if (compact) {
    return (
      <View style={styles.compactStarsContainer}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <Pressable key={index} onPress={() => handlePress(index)} style={styles.compactStar}>
            <Feather
              name={index < numStars ? "star" : "star"}
              size={24}
              color={index < numStars ? theme.primary : theme.surfaceVariant}
            />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surfaceVariant }]}>
          <Feather name={icon} size={24} color={theme.primary} />
        </View>
        <View style={styles.labelContainer}>
          <ThemedText type="body" style={styles.label}>
            {label}
          </ThemedText>
          <ThemedText type="h3" style={[styles.value, { color: theme.primary }]}>
            {numStars}/{maxStars}
          </ThemedText>
        </View>
      </View>

      <View style={styles.starsContainer}>
        {Array.from({ length: maxStars }).map((_, index) => (
          <Pressable key={index} onPress={() => handlePress(index)}>
            <Feather
              name={index < numStars ? "star" : "star"}
              size={32}
              color={index < numStars ? theme.primary : theme.surfaceVariant}
              fill={index < numStars ? theme.primary : "none"}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.labels}>
        <ThemedText type="small" style={[styles.rangeLabel, { color: theme.textSecondary }]}>
          {lowLabel}
        </ThemedText>
        <ThemedText type="small" style={[styles.rangeLabel, { color: theme.textSecondary }]}>
          {highLabel}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.cardPadding,
    borderRadius: 12,
  },
  compactStarsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    paddingVertical: Spacing.sm,
  },
  compactStar: {
    padding: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: Spacing.md,
  },
  label: {
    fontWeight: "600",
  },
  value: {
    fontWeight: "700",
  },
  starsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
    marginVertical: Spacing.lg,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  rangeLabel: {
    textAlign: "center",
    opacity: 0.8,
  },
});
