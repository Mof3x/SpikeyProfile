import React, { useState } from "react";
import { StyleSheet, View, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

import { SymptomSlider } from "@/modules/SymptomTracker/SymptomSlider";

const SYMPTOMS = [
  { key: "mood", label: "Mood", icon: "smile", lowLabel: "Low", highLabel: "Great" },
  { key: "energy", label: "Energy", icon: "battery-charging", lowLabel: "Drained", highLabel: "Energized" },
  { key: "brainFog", label: "Brain Fog", icon: "cloud", lowLabel: "Clear", highLabel: "Foggy" },
  { key: "sensoryOverload", label: "Sensory Overload", icon: "volume-2", lowLabel: "Calm", highLabel: "Overwhelmed" },
  { key: "executiveDysfunction", label: "Executive Function", icon: "list", lowLabel: "Focused", highLabel: "Struggling" },
];

export default function TrackScreen() {
  const { theme } = useTheme();
  const { isModuleEnabled } = useModules();
  const { addSymptomEntry } = useData();

  const [values, setValues] = useState({
    mood: 5,
    energy: 5,
    brainFog: 5,
    sensoryOverload: 5,
    executiveDysfunction: 5,
  });

  const [saved, setSaved] = useState(false);

  const handleValueChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    Haptics.selectionAsync();
  };

  const handleSave = () => {
    addSymptomEntry(values);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isModuleEnabled("symptomTracker")) {
    return (
      <ScreenScrollView contentContainerStyle={styles.disabledContainer}>
        <Feather name="activity" size={48} color={theme.textSecondary} />
        <Spacer height={Spacing.lg} />
        <ThemedText type="h3" style={styles.disabledTitle}>
          Symptom Tracker Disabled
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.disabledText, { color: theme.textSecondary }]}
        >
          Enable the Symptom Tracker module in Settings to start logging.
        </ThemedText>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.timestampContainer}>
        <Feather name="clock" size={14} color={theme.textSecondary} />
        <ThemedText
          type="small"
          style={[styles.timestamp, { color: theme.textSecondary }]}
        >
          {new Date().toLocaleString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      {SYMPTOMS.map((symptom, index) => (
        <View key={symptom.key}>
          <SymptomSlider
            label={symptom.label}
            icon={symptom.icon as any}
            value={values[symptom.key as keyof typeof values]}
            onValueChange={(v) => handleValueChange(symptom.key, v)}
            lowLabel={symptom.lowLabel}
            highLabel={symptom.highLabel}
          />
          {index < SYMPTOMS.length - 1 && <Spacer height={Spacing.xl} />}
        </View>
      ))}

      <Spacer height={Spacing["3xl"]} />

      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: saved ? theme.success : theme.primary,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Feather
          name={saved ? "check" : "save"}
          size={20}
          color="#FFFFFF"
          style={styles.saveIcon}
        />
        <ThemedText type="body" style={styles.saveText}>
          {saved ? "Saved!" : "Save Entry"}
        </ThemedText>
      </Pressable>

      <Spacer height={Spacing["5xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timestamp: {
    opacity: 0.8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  saveIcon: {
    marginRight: Spacing.xs,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disabledContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  disabledTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  disabledText: {
    textAlign: "center",
    opacity: 0.7,
  },
});
