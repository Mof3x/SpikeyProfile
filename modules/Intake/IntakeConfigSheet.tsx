import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import {
  ChoiceChip,
  SaveButton,
  SheetModal,
  sheetStyles,
} from "@/components/SheetModal";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { BorderRadius, Spacing } from "@/constants/theme";

/** Edit the food tags and substances offered when logging. */
export function IntakeConfigSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme, typography } = useTheme();
  const { intakeConfig, setIntakeConfig, insightSettings } = useData();
  const [newTag, setNewTag] = useState("");
  const [newSubstance, setNewSubstance] = useState("");
  const [newUnit, setNewUnit] = useState("times");

  const toggleTag = (tag: string) => {
    const hidden = intakeConfig.hiddenTags.includes(tag)
      ? intakeConfig.hiddenTags.filter((t) => t !== tag)
      : [...intakeConfig.hiddenTags, tag];
    setIntakeConfig({ ...intakeConfig, hiddenTags: hidden });
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || intakeConfig.tags.includes(tag)) return;
    setIntakeConfig({ ...intakeConfig, tags: [...intakeConfig.tags, tag] });
    setNewTag("");
  };

  const addSubstance = () => {
    const name = newSubstance.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (intakeConfig.substances.some((s) => s.id === id)) return;
    setIntakeConfig({
      ...intakeConfig,
      substances: [
        ...intakeConfig.substances,
        { id, name, unit: newUnit.trim() || "times", enabled: true },
      ],
    });
    setNewSubstance("");
  };

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.surfaceVariant,
      fontSize: typography.body.fontSize,
    },
  ];

  return (
    <SheetModal
      visible={visible}
      title="Food & substance options"
      onClose={onClose}
    >
      <ThemedText type="small" style={sheetStyles.label}>
        Food tags (tap to show or hide)
      </ThemedText>
      <View style={sheetStyles.chips}>
        {intakeConfig.tags.map((tag) => (
          <ChoiceChip
            key={tag}
            label={tag}
            selected={!intakeConfig.hiddenTags.includes(tag)}
            onPress={() => toggleTag(tag)}
          />
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          value={newTag}
          onChangeText={setNewTag}
          placeholder="Add a tag"
          placeholderTextColor={theme.textSecondary}
          style={[inputStyle, { flex: 1 }]}
          onSubmitEditing={addTag}
        />
        <Pressable
          onPress={addTag}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          accessibilityLabel="Add tag"
        >
          <Feather name="plus" size={20} color={theme.buttonText} />
        </Pressable>
      </View>

      {insightSettings.substancesEnabled ? (
        <>
          <ThemedText type="small" style={sheetStyles.label}>
            Substances
          </ThemedText>
          {intakeConfig.substances.map((s, i) => (
            <View
              key={s.id}
              style={[styles.row, { borderBottomColor: theme.divider }]}
            >
              <ThemedText type="body" style={{ flex: 1 }}>
                {s.name}{" "}
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary }}
                >
                  ({s.unit})
                </ThemedText>
              </ThemedText>
              <Switch
                value={s.enabled}
                onValueChange={(v) => {
                  const substances = [...intakeConfig.substances];
                  substances[i] = { ...s, enabled: v };
                  setIntakeConfig({ ...intakeConfig, substances });
                }}
                trackColor={{ false: "#3A4150", true: theme.primary }}
                thumbColor="#FFFFFF"
                accessibilityLabel={`Offer ${s.name} when logging`}
              />
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              value={newSubstance}
              onChangeText={setNewSubstance}
              placeholder="Add a substance"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, { flex: 2 }]}
            />
            <TextInput
              value={newUnit}
              onChangeText={setNewUnit}
              placeholder="unit"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, { flex: 1 }]}
            />
          </View>
          <SaveButton
            label="Add substance"
            onPress={addSubstance}
            disabled={!newSubstance.trim()}
          />
        </>
      ) : (
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginTop: Spacing.lg }}
        >
          Substance logging is off. Turn it on in Settings → Insights &
          predictions to edit the list.
        </ThemedText>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  addRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
