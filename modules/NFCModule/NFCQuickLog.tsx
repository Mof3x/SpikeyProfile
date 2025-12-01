import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData, QuickLogAction } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

function QuickLogButton({
  action,
  onPress,
}: {
  action: QuickLogAction;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 15 }),
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    opacity.value = withSequence(
      withSpring(0.7),
      withDelay(100, withSpring(1))
    );
    onPress();
  };

  const categoryColors = {
    medication: theme.accent,
    habit: theme.secondary,
    custom: theme.primary,
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress}>
        <View
          style={[
            styles.quickButton,
            { backgroundColor: categoryColors[action.category] + "20" },
          ]}
        >
          <Feather
            name={action.icon as any}
            size={24}
            color={categoryColors[action.category]}
          />
        </View>
        <ThemedText type="caption" style={styles.quickButtonLabel} numberOfLines={2}>
          {action.name}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function NFCQuickLogCard() {
  const { theme, typography } = useTheme();
  const { quickLogActions, logQuickAction, addQuickLogAction, quickLogEntries } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActionName, setNewActionName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("star");
  const [selectedCategory, setSelectedCategory] = useState<"medication" | "habit" | "custom">("custom");

  const enabledActions = quickLogActions.filter((a) => a.enabled);
  const todayLogs = quickLogEntries.filter((e) => {
    const entryDate = new Date(e.timestamp);
    const today = new Date();
    return entryDate.toDateString() === today.toDateString();
  });

  const handleLogAction = (actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logQuickAction(actionId);
  };

  const handleAddAction = () => {
    if (newActionName.trim()) {
      addQuickLogAction({
        name: newActionName.trim(),
        icon: selectedIcon,
        category: selectedCategory,
        enabled: true,
      });
      setNewActionName("");
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const icons = ["plus-circle", "droplet", "sun", "moon", "coffee", "heart", "star", "zap", "smile", "activity"];
  const categories = [
    { id: "medication", label: "Medication", icon: "plus-circle" },
    { id: "habit", label: "Habit", icon: "repeat" },
    { id: "custom", label: "Custom", icon: "star" },
  ];

  return (
    <>
      <Card elevation={1}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="zap" size={18} color={theme.secondary} />
            </View>
            <View>
              <ThemedText type="h4">Quick Log</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {todayLogs.length} logged today
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="plus" size={18} color={theme.primary} />
          </Pressable>
        </View>

        <View style={styles.quickButtonsGrid}>
          {enabledActions.slice(0, 6).map((action) => (
            <QuickLogButton
              key={action.id}
              action={action}
              onPress={() => handleLogAction(action.id)}
            />
          ))}
        </View>

        <View style={[styles.nfcHint, { backgroundColor: theme.surfaceVariant }]}>
          <Feather name="smartphone" size={14} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Tap to log instantly
          </ThemedText>
        </View>
      </Card>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Add Quick Action</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.surfaceVariant, 
                  color: theme.text,
                  fontSize: typography.body.fontSize,
                },
              ]}
              value={newActionName}
              onChangeText={setNewActionName}
              placeholder="What would you like to track?"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Category
            </ThemedText>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id as any)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor:
                        selectedCategory === cat.id ? theme.primary : theme.surfaceVariant,
                    },
                  ]}
                >
                  <Feather
                    name={cat.icon as any}
                    size={16}
                    color={selectedCategory === cat.id ? "#FFFFFF" : theme.text}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: selectedCategory === cat.id ? "#FFFFFF" : theme.text }}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Icon
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.iconRow}>
                {icons.map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor:
                          selectedIcon === icon ? theme.primary : theme.surfaceVariant,
                      },
                    ]}
                  >
                    <Feather
                      name={icon as any}
                      size={20}
                      color={selectedIcon === icon ? "#FFFFFF" : theme.text}
                    />
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={handleAddAction}
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Add Action
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  quickButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "flex-start",
  },
  quickButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickButtonLabel: {
    marginTop: Spacing.xs,
    textAlign: "center",
    width: 56,
  },
  nfcHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    marginBottom: Spacing.xl,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  iconRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
