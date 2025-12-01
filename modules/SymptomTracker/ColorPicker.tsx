import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ColorPickerProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: number;
  onValueChange: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  compact?: boolean;
}

const COLOR_SCALE = [
  "#FF6B6B", // Red (1)
  "#FFA500", // Orange (3)
  "#FFD700", // Yellow (5)
  "#90EE90", // Light Green (7)
  "#4ECDC4", // Teal (10)
];

const COLOR_TO_VALUE: Record<string, number> = {
  "#FF6B6B": 1,
  "#FFA500": 3,
  "#FFD700": 5,
  "#90EE90": 7,
  "#4ECDC4": 10,
};

const VALUE_TO_COLOR: Record<number, string> = {
  1: "#FF6B6B",
  2: "#FF6B6B",
  3: "#FFA500",
  4: "#FFA500",
  5: "#FFD700",
  6: "#90EE90",
  7: "#90EE90",
  8: "#4ECDC4",
  9: "#4ECDC4",
  10: "#4ECDC4",
};

export function ColorPicker({
  label,
  icon,
  value,
  onValueChange,
  lowLabel = "Low",
  highLabel = "High",
  compact = false,
}: ColorPickerProps) {
  const { theme } = useTheme();
  const currentColor = VALUE_TO_COLOR[value] || VALUE_TO_COLOR[5];

  const handleColorPress = (color: string) => {
    Haptics.selectionAsync();
    const newValue = COLOR_TO_VALUE[color];
    onValueChange(newValue);
  };

  if (compact) {
    return (
      <View style={styles.compactColorGrid}>
        {COLOR_SCALE.map((color) => (
          <Pressable
            key={color}
            onPress={() => handleColorPress(color)}
            style={[
              styles.compactColorOption,
              {
                backgroundColor: color,
                borderWidth: currentColor === color ? 2 : 0,
                borderColor: theme.text,
              },
            ]}
          />
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
          <View style={[styles.colorDisplay, { backgroundColor: currentColor }]} />
        </View>
      </View>

      <View style={styles.colorGrid}>
        {COLOR_SCALE.map((color) => (
          <Pressable
            key={color}
            onPress={() => handleColorPress(color)}
            style={[
              styles.colorOption,
              {
                backgroundColor: color,
                borderWidth: currentColor === color ? 3 : 0,
                borderColor: theme.text,
              },
            ]}
          />
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
    borderRadius: BorderRadius.lg,
  },
  compactColorGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    paddingVertical: Spacing.sm,
  },
  compactColorOption: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
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
  colorDisplay: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
  },
  colorGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
    marginVertical: Spacing.lg,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
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
