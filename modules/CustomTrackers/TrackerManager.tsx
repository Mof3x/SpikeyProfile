import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import {
  ChoiceChip,
  SaveButton,
  SheetModal,
  sheetStyles,
} from "@/components/SheetModal";
import { useTheme } from "@/hooks/useTheme";
import { useData, type CustomTracker } from "@/core/DataContext";
import { BorderRadius, Spacing } from "@/constants/theme";
import { confirmAction } from "@/core/confirm";

const TYPES: {
  id: CustomTracker["inputType"];
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    id: "slider",
    label: "Scale 1–10",
    hint: "e.g. pain, anxiety, focus",
    icon: "sliders",
  },
  {
    id: "toggle",
    label: "Yes / no",
    hint: "e.g. had a nap, saw friends",
    icon: "toggle-right",
  },
  {
    id: "counter",
    label: "Counter",
    hint: "e.g. hours of screen time, cigarettes",
    icon: "plus-circle",
  },
  {
    id: "color",
    label: "Colour scale",
    hint: "pick a colour for how it felt",
    icon: "droplet",
  },
  { id: "text", label: "Note", hint: "kept, but not analysed", icon: "edit-3" },
];

/** Settings sheet for creating, renaming, pausing and deleting your own trackers. */
export function TrackerManager({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme, typography } = useTheme();
  const {
    customTrackers,
    addCustomTracker,
    removeCustomTracker,
    toggleCustomTracker,
    updateCustomTracker,
  } = useData();
  const [name, setName] = useState("");
  const [inputType, setInputType] =
    useState<CustomTracker["inputType"]>("slider");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const add = () => {
    if (!name.trim()) return;
    addCustomTracker({
      name: name.trim(),
      inputType,
      icon: TYPES.find((t) => t.id === inputType)!.icon,
      enabled: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName("");
  };

  const confirmDelete = (tracker: CustomTracker) => {
    confirmAction(
      `Delete "${tracker.name}"?`,
      "The tracker is removed. Entries you've already logged are kept.",
      "Delete",
      () => removeCustomTracker(tracker.id),
    );
  };

  return (
    <SheetModal visible={visible} title="My trackers" onClose={onClose}>
      {customTrackers.length === 0 ? (
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
        >
          Track anything else you’d like the app to look for patterns in. Every
          tracker you add is analysed automatically.
        </ThemedText>
      ) : null}

      {customTrackers.map((t) => (
        <View
          key={t.id}
          style={[styles.row, { borderBottomColor: theme.divider }]}
        >
          <Feather
            name={(t.icon || "sliders") as any}
            size={18}
            color={theme.primary}
          />
          {renaming === t.id ? (
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              onSubmitEditing={() => {
                if (renameText.trim())
                  updateCustomTracker(t.id, { name: renameText.trim() });
                setRenaming(null);
              }}
              onBlur={() => setRenaming(null)}
              style={[
                styles.input,
                {
                  flex: 1,
                  color: theme.text,
                  backgroundColor: theme.surfaceVariant,
                  fontSize: typography.body.fontSize,
                },
              ]}
            />
          ) : (
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                setRenaming(t.id);
                setRenameText(t.name);
              }}
              accessibilityHint="Rename"
            >
              <ThemedText type="body">{t.name}</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {TYPES.find((x) => x.id === t.inputType)?.label} · tap to rename
              </ThemedText>
            </Pressable>
          )}
          <Switch
            value={t.enabled}
            onValueChange={() => toggleCustomTracker(t.id)}
            trackColor={{ false: "#3A4150", true: theme.primary }}
            thumbColor="#FFFFFF"
            accessibilityLabel={`Show ${t.name} on the Track tab`}
          />
          <Pressable
            onPress={() => confirmDelete(t)}
            hitSlop={10}
            accessibilityLabel={`Delete ${t.name}`}
          >
            <Feather name="trash-2" size={18} color={theme.error} />
          </Pressable>
        </View>
      ))}

      <ThemedText type="small" style={sheetStyles.label}>
        Add a tracker
      </ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="What do you want to track?"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.surfaceVariant,
            fontSize: typography.body.fontSize,
          },
        ]}
      />
      <View style={[sheetStyles.chips, { marginTop: Spacing.md }]}>
        {TYPES.map((t) => (
          <ChoiceChip
            key={t.id}
            label={t.label}
            icon={t.icon}
            selected={inputType === t.id}
            onPress={() => setInputType(t.id)}
          />
        ))}
      </View>
      <ThemedText
        type="caption"
        style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
      >
        {TYPES.find((t) => t.id === inputType)?.hint}
      </ThemedText>
      <SaveButton label="Add tracker" onPress={add} disabled={!name.trim()} />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: {
    minHeight: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
});
