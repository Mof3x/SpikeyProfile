import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SymptomSliderProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: number;
  onValueChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}

export function SymptomSlider({
  label,
  icon,
  value,
  onValueChange,
  lowLabel,
  highLabel,
}: SymptomSliderProps) {
  const { theme } = useTheme();

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
            {Math.round(value)}
          </ThemedText>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.surfaceVariant}
        thumbTintColor={theme.primary}
      />

      <View style={styles.labels}>
        <ThemedText
          type="small"
          style={[styles.rangeLabel, { color: theme.textSecondary }]}
        >
          {lowLabel}
        </ThemedText>
        <ThemedText
          type="small"
          style={[styles.rangeLabel, { color: theme.textSecondary }]}
        >
          {highLabel}
        </ThemedText>
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
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
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
  slider: {
    width: "100%",
    height: 40,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  rangeLabel: {
    opacity: 0.7,
  },
});
