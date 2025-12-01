import React, { useState } from "react";
import { StyleSheet, View, Pressable, Alert, TextInput, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

import { SymptomSlider } from "@/modules/SymptomTracker/SymptomSlider";
import { StarRating } from "@/modules/SymptomTracker/StarRating";
import { ColorPicker } from "@/modules/SymptomTracker/ColorPicker";

type InputType = "slider" | "stars" | "color";

const INPUT_TYPES: InputType[] = ["slider", "stars", "color"];
const INPUT_LABELS: Record<InputType, string> = {
  slider: "Slider",
  stars: "Stars",
  color: "Color",
};

const ALL_SYMPTOMS = [
  { key: "mood", label: "Mood", icon: "smile", lowLabel: "Low", highLabel: "Great" },
  { key: "energy", label: "Energy", icon: "battery-charging", lowLabel: "Drained", highLabel: "Energized" },
  { key: "brainFog", label: "Brain Fog", icon: "cloud", lowLabel: "Clear", highLabel: "Foggy" },
  { key: "sensoryOverload", label: "Sensory Overload", icon: "volume-2", lowLabel: "Calm", highLabel: "Overwhelmed" },
  { key: "executiveDysfunction", label: "Executive Function", icon: "list", lowLabel: "Focused", highLabel: "Struggling" },
];

const DEFAULT_SELECTED_SYMPTOMS = ["mood", "energy", "brainFog", "sensoryOverload", "executiveDysfunction"];

export default function TrackScreen() {
  const { theme, typography } = useTheme();
  const { isModuleEnabled } = useModules();
  const { addSymptomEntry, addTodo, addQuickLogAction, logQuickAction, quickLogActions } = useData();

  const [values, setValues] = useState({
    mood: 5,
    energy: 5,
    brainFog: 5,
    sensoryOverload: 5,
    executiveDysfunction: 5,
  });

  const [saved, setSaved] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(DEFAULT_SELECTED_SYMPTOMS);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showInputTypeModal, setShowInputTypeModal] = useState(false);
  const [selectedSymptomForInputType, setSelectedSymptomForInputType] = useState<string | null>(null);
  const [inputTypes, setInputTypes] = useState<Record<string, InputType>>({
    mood: "slider",
    energy: "slider",
    brainFog: "slider",
    sensoryOverload: "slider",
    executiveDysfunction: "slider",
  });
  const [newTodoText, setNewTodoText] = useState("");
  const [showQuickLog, setShowQuickLog] = useState(false);

  const handleValueChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    Haptics.selectionAsync();
  };

  const toggleSymptom = (symptomKey: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) =>
      prev.includes(symptomKey)
        ? prev.filter((k) => k !== symptomKey)
        : [...prev, symptomKey]
    );
  };

  const handleSave = () => {
    addSymptomEntry(values);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo({ title: newTodoText.trim(), completed: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewTodoText("");
  };

  const handleQuickLog = (actionId: string) => {
    logQuickAction(actionId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      <View style={[styles.customizeSection, { backgroundColor: theme.surfaceVariant }]}>
        <View style={styles.customizeSectionHeader}>
          <ThemedText type="small" style={{ fontWeight: "600" }}>
            Symptoms to track
          </ThemedText>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowCustomizeModal(true);
            }}
            style={[styles.customizeButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        <View style={styles.selectedSymptomsTags}>
          {selectedSymptoms.length > 0 ? (
            selectedSymptoms.map((key) => {
              const symptom = ALL_SYMPTOMS.find((s) => s.key === key);
              return symptom ? (
                <View
                  key={key}
                  style={[styles.symptomTag, { backgroundColor: theme.primary + "30" }]}
                >
                  <ThemedText type="caption" style={{ color: theme.primary }}>
                    {symptom.label}
                  </ThemedText>
                </View>
              ) : null;
            })
          ) : (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Select symptoms to track
            </ThemedText>
          )}
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      {ALL_SYMPTOMS.filter((s) => selectedSymptoms.includes(s.key)).map((symptom, index, arr) => {
        const inputType = inputTypes[symptom.key] || "slider";
        const InputComponent = 
          inputType === "stars" ? StarRating : 
          inputType === "color" ? ColorPicker : 
          SymptomSlider;

        return (
          <View key={symptom.key}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedSymptomForInputType(symptom.key);
                setShowInputTypeModal(true);
              }}
              style={[styles.inputTypeIndicator, { backgroundColor: theme.surfaceVariant }]}
            >
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {INPUT_LABELS[inputType]} mode
              </ThemedText>
              <Feather name="edit-2" size={12} color={theme.textSecondary} />
            </Pressable>
            <Spacer height={Spacing.sm} />
            <InputComponent
              label={symptom.label}
              icon={symptom.icon as any}
              value={values[symptom.key as keyof typeof values]}
              onValueChange={(v) => handleValueChange(symptom.key, v)}
              lowLabel={symptom.lowLabel}
              highLabel={symptom.highLabel}
            />
            {index < arr.length - 1 && <Spacer height={Spacing.xl} />}
          </View>
        );
      })}

      <Spacer height={Spacing["3xl"]} />

      <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Quick Log</ThemedText>
      {quickLogActions.slice(0, 4).map((action) => (
        <Pressable
          key={action.id}
          onPress={() => handleQuickLog(action.id)}
          style={[styles.quickLogButton, { backgroundColor: theme.surfaceVariant }]}
        >
          <Feather name="zap" size={16} color={theme.primary} />
          <ThemedText type="body">{action.name}</ThemedText>
        </Pressable>
      ))}

      <Spacer height={Spacing.xl} />

      <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Add To-Do</ThemedText>
      <View style={[styles.todoInput, { backgroundColor: theme.surfaceVariant }]}>
        <TextInput
          style={[{ flex: 1, color: theme.text, fontSize: typography.body.fontSize }]}
          value={newTodoText}
          onChangeText={setNewTodoText}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.textSecondary}
        />
        <Pressable onPress={handleAddTodo} disabled={!newTodoText.trim()}>
          <Feather name="plus-circle" size={20} color={newTodoText.trim() ? theme.primary : theme.textSecondary} />
        </Pressable>
      </View>

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

      <Modal
        visible={showInputTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInputTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Choose logging style</ThemedText>
              <Pressable onPress={() => setShowInputTypeModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {INPUT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => {
                    if (selectedSymptomForInputType) {
                      Haptics.selectionAsync();
                      setInputTypes((prev) => ({
                        ...prev,
                        [selectedSymptomForInputType]: type,
                      }));
                      setShowInputTypeModal(false);
                    }
                  }}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor:
                        inputTypes[selectedSymptomForInputType || ""] === type
                          ? theme.primary + "30"
                          : theme.surfaceVariant,
                      borderColor:
                        inputTypes[selectedSymptomForInputType || ""] === type
                          ? theme.primary
                          : "transparent",
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Feather
                    name={
                      type === "slider"
                        ? "sliders"
                        : type === "stars"
                          ? "star"
                          : "palette"
                    }
                    size={24}
                    color={
                      inputTypes[selectedSymptomForInputType || ""] === type
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {INPUT_LABELS[type]}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                    >
                      {type === "slider"
                        ? "Move a slider from low to high"
                        : type === "stars"
                          ? "Rate out of 5 stars"
                          : "Pick a color from the spectrum"}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
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
  customizeSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  customizeSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  customizeButton: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedSymptomsTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  symptomTag: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  quickLogButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  todoInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  inputTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
});
