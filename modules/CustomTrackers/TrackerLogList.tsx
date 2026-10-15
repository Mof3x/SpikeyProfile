import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData, type CustomTracker } from "@/core/DataContext";
import { useLoggedFeedback } from "@/core/LoggedFeedbackContext";
import { SymptomSlider } from "@/modules/SymptomTracker/SymptomSlider";
import { ColorPicker } from "@/modules/SymptomTracker/ColorPicker";
import { BorderRadius, Spacing } from "@/constants/theme";

/** "My trackers" on the Track tab: log anything you've chosen to track in one or two taps. */
export function TrackerLogList() {
  const { theme } = useTheme();
  const { customTrackers, customTrackerEntries } = useData();
  const enabled = customTrackers.filter((t) => t.enabled);

  if (enabled.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.surfaceVariant }]}>
        <Feather name="sliders" size={20} color={theme.textSecondary} />
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, flex: 1 }}
        >
          Want to track something else, like pain, screen time or social time?
          Add your own trackers in Settings → Insights & predictions.
        </ThemedText>
      </View>
    );
  }

  const todayStr = new Date().toDateString();
  return (
    <View style={{ gap: Spacing.sm }}>
      {enabled.map((tracker) => (
        <TrackerRow
          key={tracker.id}
          tracker={tracker}
          loggedToday={
            customTrackerEntries.filter(
              (e) =>
                e.trackerId === tracker.id &&
                new Date(e.timestamp).toDateString() === todayStr,
            ).length
          }
        />
      ))}
    </View>
  );
}

function TrackerRow({
  tracker,
  loggedToday,
}: {
  tracker: CustomTracker;
  loggedToday: number;
}) {
  const { theme } = useTheme();
  const { addCustomTrackerEntry } = useData();
  const { showLogged } = useLoggedFeedback();
  const [value, setValue] = useState(5);
  const [text, setText] = useState("");

  const log = (v: string | number | boolean, label?: string) => {
    addCustomTrackerEntry(tracker.id, v);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showLogged(label ?? tracker.name, tracker.icon || "sliders");
  };

  const smallButton = (label: string, onPress: () => void, primary = false) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.button,
        {
          backgroundColor: primary ? theme.primary : theme.backgroundSecondary,
        },
      ]}
    >
      <ThemedText
        type="small"
        style={{
          color: primary ? theme.buttonText : theme.text,
          fontWeight: "600",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.row, { backgroundColor: theme.surfaceVariant }]}>
      <View style={styles.rowHeader}>
        <Feather
          name={(tracker.icon || "sliders") as any}
          size={16}
          color={theme.primary}
        />
        <ThemedText type="body" style={{ flex: 1, fontWeight: "600" }}>
          {tracker.name}
        </ThemedText>
        {loggedToday > 0 ? (
          <ThemedText type="caption" style={{ color: theme.success }}>
            Logged today{loggedToday > 1 ? ` ×${loggedToday}` : ""}
          </ThemedText>
        ) : null}
      </View>
      {tracker.inputType === "slider" ? (
        <View style={styles.inline}>
          <View style={{ flex: 1 }}>
            <SymptomSlider
              label=""
              icon="sliders"
              value={value}
              onValueChange={setValue}
              lowLabel="Low"
              highLabel="High"
              compact
            />
          </View>
          {smallButton(
            "Log",
            () => log(value, `${tracker.name}: ${value}`),
            true,
          )}
        </View>
      ) : tracker.inputType === "color" ? (
        <View style={styles.inline}>
          <View style={{ flex: 1 }}>
            <ColorPicker
              label=""
              icon="droplet"
              value={value}
              onValueChange={setValue}
              lowLabel="Low"
              highLabel="High"
              compact
            />
          </View>
          {smallButton(
            "Log",
            () => log(value, `${tracker.name}: ${value}`),
            true,
          )}
        </View>
      ) : tracker.inputType === "toggle" ? (
        <View style={styles.inline}>
          {smallButton("Yes", () => log(true, `${tracker.name}: yes`), true)}
          {smallButton("No", () => log(false, `${tracker.name}: no`))}
        </View>
      ) : tracker.inputType === "counter" ? (
        <View style={styles.inline}>
          {smallButton("+1", () => log(1, `${tracker.name} +1`), true)}
        </View>
      ) : (
        <View style={styles.inline}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a note"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundSecondary },
            ]}
          />
          {smallButton(
            "Save",
            () => {
              if (!text.trim()) return;
              log(text.trim());
              setText("");
            },
            true,
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  row: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  button: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
});
