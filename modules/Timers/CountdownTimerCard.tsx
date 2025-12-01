import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData, CountdownTimer } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const CATEGORY_CONFIG = {
  appointment: { icon: "calendar", color: "#4CAF50" },
  medication: { icon: "heart", color: "#E91E63" },
  deadline: { icon: "alert-circle", color: "#FF9800" },
  event: { icon: "star", color: "#9C27B0" },
  custom: { icon: "clock", color: "#2196F3" },
};

export function CountdownTimerCard() {
  const { theme, typography } = useTheme();
  const { countdownTimers, addCountdownTimer, updateCountdownTimer, removeCountdownTimer } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<CountdownTimer["category"]>("event");
  const [newTargetDate, setNewTargetDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [timeLeft, setTimeLeft] = useState<{ [id: string]: { days: number; hours: number; minutes: number; seconds: number; expired: boolean } }>({});

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const result: typeof timeLeft = {};
    
    countdownTimers.forEach((timer) => {
      if (!timer.enabled) return;
      const target = new Date(timer.targetDate).getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        result[timer.id] = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        result[timer.id] = { days, hours, minutes, seconds, expired: false };
      }
    });
    
    setTimeLeft(result);
  }, [countdownTimers]);

  useEffect(() => {
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  const handleAddTimer = () => {
    if (!newName.trim()) return;
    
    addCountdownTimer({
      name: newName.trim(),
      targetDate: newTargetDate,
      category: newCategory,
      icon: CATEGORY_CONFIG[newCategory].icon,
      color: CATEGORY_CONFIG[newCategory].color,
      enabled: true,
    });
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setNewName("");
    setNewCategory("event");
    setNewTargetDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  };

  const handleToggleTimer = (id: string, enabled: boolean) => {
    Haptics.selectionAsync();
    updateCountdownTimer(id, { enabled: !enabled });
  };

  const handleRemoveTimer = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeCountdownTimer(id);
  };

  const formatTimeUnit = (value: number, label: string) => {
    return `${value}${label}`;
  };

  const enabledTimers = countdownTimers.filter((t) => t.enabled);

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="clock" size={18} color={theme.primary} />
            </View>
            <ThemedText type="h3">Countdown Timers</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {enabledTimers.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              No active countdowns. Tap + to add one!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.timersList}>
            {enabledTimers.slice(0, 3).map((timer) => {
              const time = timeLeft[timer.id];
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
                        time.expired ? (
                          <ThemedText type="caption" style={{ color: theme.error }}>
                            Completed!
                          </ThemedText>
                        ) : (
                          <ThemedText type="caption" style={{ color: config.color, fontWeight: "600" }}>
                            {time.days > 0 ? formatTimeUnit(time.days, "d ") : ""}
                            {formatTimeUnit(time.hours, "h ")}
                            {formatTimeUnit(time.minutes, "m ")}
                            {formatTimeUnit(time.seconds, "s")}
                          </ThemedText>
                        )
                      ) : (
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          Calculating...
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <Pressable onPress={() => handleRemoveTimer(timer.id)} hitSlop={8}>
                    <Feather name="x" size={18} color={theme.textSecondary} />
                  </Pressable>
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
              <ThemedText type="h3">Add Countdown</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
                What are you counting down to?
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g., Doctor's appointment, Birthday..."
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
                Target Date & Time
              </ThemedText>
              
              <View style={styles.dateTimeRow}>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.dateTimeButton, { backgroundColor: theme.surfaceVariant }]}
                >
                  <Feather name="calendar" size={18} color={theme.primary} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                    {newTargetDate.toLocaleDateString()}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  style={[styles.dateTimeButton, { backgroundColor: theme.surfaceVariant }]}
                >
                  <Feather name="clock" size={18} color={theme.primary} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                    {newTargetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </ThemedText>
                </Pressable>
              </View>

              {(showDatePicker || showTimePicker) && Platform.OS !== "web" && (
                <DateTimePicker
                  value={newTargetDate}
                  mode={showDatePicker ? "date" : "time"}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                    if (date) setNewTargetDate(date);
                  }}
                  minimumDate={new Date()}
                />
              )}

              <Pressable
                onPress={handleAddTimer}
                style={[styles.saveButton, { backgroundColor: theme.primary, opacity: newName.trim() ? 1 : 0.5 }]}
                disabled={!newName.trim()}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Add Countdown
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "85%",
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
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
});
