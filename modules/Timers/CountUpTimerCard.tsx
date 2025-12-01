import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData, CountUpTimer } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const CATEGORY_CONFIG = {
  medication: { icon: "heart", color: "#E91E63", label: "Last medication" },
  meal: { icon: "coffee", color: "#4CAF50", label: "Last meal" },
  task: { icon: "check-circle", color: "#2196F3", label: "Time on task" },
  custom: { icon: "clock", color: "#9C27B0", label: "Custom" },
};

export function CountUpTimerCard() {
  const { theme, typography } = useTheme();
  const { countUpTimers, addCountUpTimer, updateCountUpTimer, removeCountUpTimer, resetCountUpTimer } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<CountUpTimer["category"]>("medication");
  const [newTargetHours, setNewTargetHours] = useState("");
  const [elapsedTime, setElapsedTime] = useState<{ [id: string]: { hours: number; minutes: number; seconds: number; warning: boolean } }>({});

  const calculateElapsed = useCallback(() => {
    const now = new Date().getTime();
    const result: typeof elapsedTime = {};
    
    countUpTimers.forEach((timer) => {
      if (!timer.enabled) return;
      const start = new Date(timer.startTime).getTime();
      const diff = now - start;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const warning = timer.targetHours ? hours >= timer.targetHours : false;
      
      result[timer.id] = { hours, minutes, seconds, warning };
    });
    
    setElapsedTime(result);
  }, [countUpTimers]);

  useEffect(() => {
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [calculateElapsed]);

  const handleAddTimer = () => {
    if (!newName.trim()) return;
    
    addCountUpTimer({
      name: newName.trim(),
      startTime: new Date(),
      category: newCategory,
      icon: CATEGORY_CONFIG[newCategory].icon,
      color: CATEGORY_CONFIG[newCategory].color,
      enabled: true,
      targetHours: newTargetHours ? parseInt(newTargetHours, 10) : undefined,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setNewName("");
    setNewCategory("medication");
    setNewTargetHours("");
  };

  const handleResetTimer = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetCountUpTimer(id);
  };

  const handleRemoveTimer = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeCountUpTimer(id);
  };

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const enabledTimers = countUpTimers.filter((t) => t.enabled);

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="activity" size={18} color={theme.accent} />
            </View>
            <ThemedText type="h3">Time Since...</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
            style={[styles.addButton, { backgroundColor: theme.accent }]}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {enabledTimers.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Track time since important events. Tap + to start!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.timersList}>
            {enabledTimers.slice(0, 3).map((timer) => {
              const time = elapsedTime[timer.id];
              const config = CATEGORY_CONFIG[timer.category];
              
              return (
                <View key={timer.id} style={[styles.timerItem, { backgroundColor: theme.surfaceVariant }]}>
                  <View style={styles.timerLeft}>
                    <View style={[styles.timerIcon, { backgroundColor: config.color + "20" }]}>
                      <Feather name={config.icon as any} size={16} color={config.color} />
                    </View>
                    <View style={styles.timerInfo}>
                      <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
                        {timer.name}
                      </ThemedText>
                      {time ? (
                        <ThemedText 
                          type="caption" 
                          style={{ 
                            color: time.warning ? theme.error : config.color,
                            fontWeight: "600",
                          }}
                        >
                          {formatTime(time.hours, time.minutes, time.seconds)} ago
                          {time.warning && " (!)"}
                        </ThemedText>
                      ) : (
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          Calculating...
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <View style={styles.timerActions}>
                    <Pressable 
                      onPress={() => handleResetTimer(timer.id)} 
                      style={[styles.resetButton, { backgroundColor: config.color + "20" }]}
                    >
                      <Feather name="refresh-cw" size={14} color={config.color} />
                    </Pressable>
                    <Pressable onPress={() => handleRemoveTimer(timer.id)} hitSlop={8}>
                      <Feather name="x" size={18} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {enabledTimers.length > 3 && (
              <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
                +{enabledTimers.length - 3} more
              </ThemedText>
            )}
          </View>
        )}
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
              <ThemedText type="h3">Track Time Since...</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                What are you tracking?
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g., Morning meds, Last coffee..."
                placeholderTextColor={theme.textSecondary}
              />

              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                Category
              </ThemedText>
              <View style={styles.categoryGrid}>
                {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const isSelected = newCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setNewCategory(cat);
                      }}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: isSelected ? config.color + "20" : theme.surfaceVariant,
                          borderColor: isSelected ? config.color : "transparent",
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <Feather name={config.icon as any} size={18} color={isSelected ? config.color : theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: isSelected ? config.color : theme.textSecondary, marginTop: 4 }}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                Warning after (hours) - optional
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                value={newTargetHours}
                onChangeText={setNewTargetHours}
                placeholder="e.g., 4 (warn after 4 hours)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
              />

              <Pressable
                onPress={handleAddTimer}
                style={[styles.saveButton, { backgroundColor: theme.accent, opacity: newName.trim() ? 1 : 0.5 }]}
                disabled={!newName.trim()}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Start Tracking
                </ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    paddingVertical: Spacing.xl,
  },
  timersList: {
    gap: Spacing.sm,
  },
  timerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timerIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  timerInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  timerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  resetButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
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
  label: {
    marginBottom: Spacing.xs,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryButton: {
    width: "47%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
});
