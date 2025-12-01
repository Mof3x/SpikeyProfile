import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { SymptomEntry } from "@/core/DataContext";

interface TodaySummaryCardProps {
  entry?: SymptomEntry;
}

const SYMPTOM_CONFIG = [
  { key: "mood", label: "Mood", icon: "smile" },
  { key: "energy", label: "Energy", icon: "battery-charging" },
  { key: "brainFog", label: "Fog", icon: "cloud" },
  { key: "sensoryOverload", label: "Sensory", icon: "volume-2" },
  { key: "executiveDysfunction", label: "Focus", icon: "list" },
];

export function TodaySummaryCard({ entry }: TodaySummaryCardProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const handlePress = () => {
    Haptics.selectionAsync();
    navigation.navigate("TrackTab");
  };

  if (!entry) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: theme.surface, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={styles.emptyContent}>
          <Feather name="edit-3" size={32} color={theme.textSecondary} />
          <ThemedText
            type="body"
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            No entry today. Tap to log symptoms.
          </ThemedText>
        </View>
      </Pressable>
    );
  }

  const getValueColor = (value: number, inverse = false) => {
    const adjusted = inverse ? 11 - value : value;
    if (adjusted >= 7) return theme.success;
    if (adjusted >= 4) return theme.accent;
    return theme.error;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <ThemedText type="h4">Today's Summary</ThemedText>
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary }}
        >
          {entry.timestamp.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </ThemedText>
      </View>

      <View style={styles.metrics}>
        {SYMPTOM_CONFIG.map((symptom) => {
          const value = entry[symptom.key as keyof SymptomEntry] as number;
          const isInverse = ["brainFog", "sensoryOverload", "executiveDysfunction"].includes(symptom.key);
          const color = getValueColor(value, isInverse);

          return (
            <View key={symptom.key} style={styles.metric}>
              <Feather name={symptom.icon as any} size={16} color={color} />
              <ThemedText
                type="small"
                style={[styles.metricValue, { color }]}
              >
                {value}
              </ThemedText>
              <ThemedText
                type="small"
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                {symptom.label}
              </ThemedText>
            </View>
          );
        })}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricValue: {
    fontWeight: "700",
    fontSize: 16,
  },
  metricLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  emptyContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
  },
});
