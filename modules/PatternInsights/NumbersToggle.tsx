import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAnalytics } from "@/core/AnalyticsContext";
import { BorderRadius, Spacing } from "@/constants/theme";

/** Switches every insight between plain words (default) and the numbers behind it. */
export function NumbersToggle() {
  const { theme } = useTheme();
  const { showNumbers, setShowNumbers } = useAnalytics();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        setShowNumbers(!showNumbers);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: showNumbers }}
      accessibilityLabel="Show the numbers"
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: showNumbers ? theme.primary : theme.surfaceVariant,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather
        name="hash"
        size={14}
        color={showNumbers ? theme.buttonText : theme.textSecondary}
      />
      <ThemedText
        type="small"
        style={{
          color: showNumbers ? theme.buttonText : theme.text,
          fontWeight: "600",
        }}
      >
        {showNumbers ? "Numbers on" : "Show the numbers"}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minHeight: 36,
  },
});
