import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useScreenInsets } from "@/hooks/useScreenInsets";

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
  { key: "sensoryOverload", label: "Sensory", icon: "volume-2", lowLabel: "Calm", highLabel: "Overwhelmed" },
  { key: "executiveDysfunction", label: "Executive", icon: "list", lowLabel: "Focused", highLabel: "Struggling" },
];

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

export default function TrackScreen() {
  const { theme, typography } = useTheme();
  const { isModuleEnabled } = useModules();
  const { addSymptomEntry, addTodo, logQuickAction, quickLogActions, todos, toggleTodo } = useData();
  const { paddingTop, paddingBottom } = useScreenInsets();

  const [activeTab, setActiveTab] = useState(0);
  const [values, setValues] = useState({
    mood: 5,
    energy: 5,
    brainFog: 5,
    sensoryOverload: 5,
    executiveDysfunction: 5,
  });
  const [saved, setSaved] = useState(false);
  const [inputTypes, setInputTypes] = useState<Record<string, InputType>>({
    mood: "slider",
    energy: "slider",
    brainFog: "slider",
    sensoryOverload: "slider",
    executiveDysfunction: "slider",
  });
  const [newTodoText, setNewTodoText] = useState("");
  const [showInputTypeModal, setShowInputTypeModal] = useState(false);
  const [selectedSymptomForInputType, setSelectedSymptomForInputType] = useState<string | null>(null);

  const tabs: TabItem[] = [
    { key: "symptoms", label: "Symptoms", icon: "activity" },
    { key: "quicklog", label: "Quick Log", icon: "zap" },
    { key: "todos", label: "To-Dos", icon: "check-square" },
  ];

  const handleValueChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleSave = () => {
    addSymptomEntry(values);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo(newTodoText.trim());
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setNewTodoText("");
  };

  const handleQuickLog = (actionId: string) => {
    logQuickAction(actionId);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTabPress = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setActiveTab(index);
  };

  if (!isModuleEnabled("symptomTracker")) {
    return (
      <View style={[styles.disabledContainer, { paddingTop, paddingBottom }]}>
        <Feather name="activity" size={48} color={theme.textSecondary} />
        <Spacer height={Spacing.lg} />
        <ThemedText type="h3" style={styles.disabledTitle}>
          Tracking Disabled
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.disabledText, { color: theme.textSecondary }]}
        >
          Enable the Symptom Tracker module in Settings.
        </ThemedText>
      </View>
    );
  }

  const renderSymptomsPage = () => (
    <ScrollView
      style={styles.pageContainer}
      contentContainerStyle={[styles.pageContent, { paddingBottom: paddingBottom + Spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.symptomsGrid}>
        {ALL_SYMPTOMS.map((symptom) => {
          const inputType = inputTypes[symptom.key] || "slider";
          return (
            <View key={symptom.key} style={styles.compactSymptomCard}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  setSelectedSymptomForInputType(symptom.key);
                  setShowInputTypeModal(true);
                }}
                style={[styles.symptomHeader, { backgroundColor: theme.surfaceVariant }]}
              >
                <View style={styles.symptomHeaderLeft}>
                  <Feather name={symptom.icon as any} size={14} color={theme.primary} />
                  <ThemedText type="small" style={{ fontWeight: "600", marginLeft: Spacing.xs }}>
                    {symptom.label}
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {values[symptom.key as keyof typeof values]}/10
                </ThemedText>
              </Pressable>
              <View style={styles.compactInputContainer}>
                {inputType === "slider" ? (
                  <SymptomSlider
                    label=""
                    icon={symptom.icon as any}
                    value={values[symptom.key as keyof typeof values]}
                    onValueChange={(v) => handleValueChange(symptom.key, v)}
                    lowLabel={symptom.lowLabel}
                    highLabel={symptom.highLabel}
                    compact
                  />
                ) : inputType === "stars" ? (
                  <StarRating
                    label=""
                    icon={symptom.icon as any}
                    value={values[symptom.key as keyof typeof values]}
                    onValueChange={(v) => handleValueChange(symptom.key, v)}
                    lowLabel={symptom.lowLabel}
                    highLabel={symptom.highLabel}
                    compact
                  />
                ) : (
                  <ColorPicker
                    label=""
                    icon={symptom.icon as any}
                    value={values[symptom.key as keyof typeof values]}
                    onValueChange={(v) => handleValueChange(symptom.key, v)}
                    lowLabel={symptom.lowLabel}
                    highLabel={symptom.highLabel}
                    compact
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Spacer height={Spacing.lg} />

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
        <Feather name={saved ? "check" : "save"} size={18} color={theme.background} />
        <ThemedText type="body" style={{ color: theme.background, fontWeight: "600", marginLeft: Spacing.sm }}>
          {saved ? "Saved!" : "Save Entry"}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );

  const renderQuickLogPage = () => (
    <ScrollView
      style={styles.pageContainer}
      contentContainerStyle={[styles.pageContent, { paddingBottom: paddingBottom + Spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
        Tap to log instantly
      </ThemedText>

      <View style={styles.quickLogGrid}>
        {quickLogActions.filter((a) => a.enabled).map((action) => (
          <Pressable
            key={action.id}
            onPress={() => handleQuickLog(action.id)}
            style={({ pressed }) => [
              styles.quickLogChip,
              {
                backgroundColor: pressed ? theme.primary : theme.surfaceVariant,
              },
            ]}
          >
            <Feather
              name={action.icon as any || "zap"}
              size={20}
              color={theme.primary}
            />
            <ThemedText type="small" style={{ marginTop: Spacing.xs, textAlign: "center" }} numberOfLines={2}>
              {action.name}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {quickLogActions.filter((a) => a.enabled).length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.surfaceVariant }]}>
          <Feather name="plus-circle" size={32} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
            No quick log actions yet. Add some in Settings.
          </ThemedText>
        </View>
      ) : null}
    </ScrollView>
  );

  const renderTodosPage = () => {
    const incompleteTodos = todos.filter((t) => !t.completed).slice(0, 8);
    const completedTodos = todos.filter((t) => t.completed).slice(0, 3);

    return (
      <ScrollView
        style={styles.pageContainer}
        contentContainerStyle={[styles.pageContent, { paddingBottom: paddingBottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.todoInputRow, { backgroundColor: theme.surfaceVariant }]}>
          <TextInput
            style={[styles.todoTextInput, { color: theme.text, fontSize: typography.body.fontSize }]}
            value={newTodoText}
            onChangeText={setNewTodoText}
            placeholder="Add a task..."
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <Pressable
            onPress={handleAddTodo}
            disabled={!newTodoText.trim()}
            style={[styles.addTodoButton, { backgroundColor: newTodoText.trim() ? theme.primary : theme.divider }]}
          >
            <Feather name="plus" size={18} color={newTodoText.trim() ? theme.background : theme.textSecondary} />
          </Pressable>
        </View>

        <Spacer height={Spacing.lg} />

        {incompleteTodos.length === 0 && completedTodos.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surfaceVariant }]}>
            <Feather name="check-circle" size={32} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: "center" }}>
              No tasks yet. Add one above!
            </ThemedText>
          </View>
        ) : null}

        {incompleteTodos.map((todo) => (
          <Pressable
            key={todo.id}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.selectionAsync();
              }
              toggleTodo(todo.id);
            }}
            style={[styles.todoItem, { backgroundColor: theme.surfaceVariant }]}
          >
            <View style={[styles.todoCheckbox, { borderColor: theme.primary }]} />
            <ThemedText type="body" style={{ flex: 1 }} numberOfLines={1}>
              {todo.text}
            </ThemedText>
          </Pressable>
        ))}

        {completedTodos.length > 0 ? (
          <>
            <Spacer height={Spacing.md} />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
              Completed
            </ThemedText>
            {completedTodos.map((todo) => (
              <Pressable
                key={todo.id}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  toggleTodo(todo.id);
                }}
                style={[styles.todoItem, { backgroundColor: theme.surfaceVariant, opacity: 0.6 }]}
              >
                <View style={[styles.todoCheckbox, { borderColor: theme.success, backgroundColor: theme.success }]}>
                  <Feather name="check" size={10} color={theme.background} />
                </View>
                <ThemedText
                  type="body"
                  style={{ flex: 1, textDecorationLine: "line-through", color: theme.textSecondary }}
                  numberOfLines={1}
                >
                  {todo.text}
                </ThemedText>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop }]}>
      <View style={styles.header}>
        <View style={styles.timestampRow}>
          <Feather name="clock" size={12} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            {new Date().toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>

        <View style={styles.tabBar}>
          {tabs.map((tab, index) => (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(index)}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === index ? theme.primary : theme.surfaceVariant,
                },
              ]}
            >
              <Feather
                name={tab.icon as any}
                size={16}
                color={activeTab === index ? theme.background : theme.textSecondary}
              />
              <ThemedText
                type="caption"
                style={{
                  color: activeTab === index ? theme.background : theme.textSecondary,
                  fontWeight: "600",
                  marginLeft: Spacing.xs,
                }}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.pageWrapper}>
        {activeTab === 0 ? renderSymptomsPage() : null}
        {activeTab === 1 ? renderQuickLogPage() : null}
        {activeTab === 2 ? renderTodosPage() : null}
      </View>

      <Modal
        visible={showInputTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInputTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Input Style</ThemedText>
              <Pressable onPress={() => setShowInputTypeModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            {INPUT_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  if (selectedSymptomForInputType) {
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync();
                    }
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
                  },
                ]}
              >
                <Feather
                  name={type === "slider" ? "sliders" : type === "stars" ? "star" : "droplet"}
                  size={20}
                  color={inputTypes[selectedSymptomForInputType || ""] === type ? theme.primary : theme.textSecondary}
                />
                <ThemedText type="body" style={{ marginLeft: Spacing.md, fontWeight: "500" }}>
                  {INPUT_LABELS[type]}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  pageWrapper: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  symptomsGrid: {
    gap: Spacing.md,
  },
  compactSymptomCard: {
    marginBottom: Spacing.xs,
  },
  symptomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  symptomHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactInputContainer: {
    marginTop: Spacing.xs,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.md,
  },
  quickLogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickLogChip: {
    width: "30%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
  },
  todoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  todoTextInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  addTodoButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
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
    marginBottom: Spacing.sm,
  },
});
