import React, { useState, useMemo, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData, CalendarEvent } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type FilterType = "all" | "events" | "reminders" | "logs" | "symptoms" | "todos" | "alarms";

interface UnifiedTimeItem {
  id: string;
  title: string;
  timestamp: Date;
  type: FilterType;
  icon: string;
  color: string;
  subtext?: string;
}

const FILTER_STORAGE_KEY = "@spikeyprofile/calendarFilters";

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(date);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

export default function CalendarScreen() {
  const { theme, typography } = useTheme();
  const { 
    calendarEvents, 
    addCalendarEvent, 
    removeCalendarEvent, 
    symptomEntries,
    quickLogEntries,
    removeQuickLogEntry,
    todos,
    alarmSchedules,
  } = useData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(["all"]));
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"reminders" | "events">("events");
  const [newEventDate, setNewEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const stored = await AsyncStorage.getItem(FILTER_STORAGE_KEY);
      if (stored) {
        const filters = JSON.parse(stored) as FilterType[];
        setActiveFilters(new Set(filters));
      }
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  };

  const saveFilters = async (filters: Set<FilterType>) => {
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(filters)));
    } catch (error) {
      console.error("Failed to save filters:", error);
    }
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const days = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const allTimeItems = useMemo((): UnifiedTimeItem[] => {
    const items: UnifiedTimeItem[] = [];

    calendarEvents.forEach((event) => {
      items.push({
        id: `event-${event.id}`,
        title: event.title,
        timestamp: new Date(event.date),
        type: event.type === "reminder" ? "reminders" : "events",
        icon: event.type === "reminder" ? "bell" : "calendar",
        color: event.type === "reminder" ? theme.accent : theme.primary,
      });
    });

    symptomEntries.forEach((entry) => {
      items.push({
        id: `symptom-${entry.id}`,
        title: "Symptom Check-in",
        timestamp: new Date(entry.timestamp),
        type: "symptoms",
        icon: "activity",
        color: theme.secondary,
        subtext: `Mood: ${entry.mood}/10, Energy: ${entry.energy}/10`,
      });
    });

    quickLogEntries.forEach((entry) => {
      items.push({
        id: `log-${entry.id}`,
        title: entry.actionName,
        timestamp: new Date(entry.timestamp),
        type: "logs",
        icon: "check-circle",
        color: theme.success,
        subtext: "Quick Log",
      });
    });

    todos.forEach((todo) => {
      if (todo.dueDate) {
        items.push({
          id: `todo-${todo.id}`,
          title: todo.text,
          timestamp: new Date(todo.dueDate),
          type: "todos",
          icon: todo.completed ? "check-square" : "square",
          color: todo.completed ? theme.success : theme.accent,
          subtext: todo.completed ? "Completed" : "Due",
        });
      }
    });

    alarmSchedules.forEach((schedule) => {
      if (schedule.enabled) {
        items.push({
          id: `alarm-${schedule.id}`,
          title: schedule.name,
          timestamp: new Date(schedule.startTime),
          type: "alarms",
          icon: "clock",
          color: theme.accent,
          subtext: `${schedule.numberOfAlarms} alarms`,
        });
      }
    });

    return items;
  }, [calendarEvents, symptomEntries, quickLogEntries, todos, alarmSchedules, theme]);

  const getItemsForDate = useCallback((date: Date): UnifiedTimeItem[] => {
    return allTimeItems.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate.toDateString() === date.toDateString();
    });
  }, [allTimeItems]);

  const getIndicatorsForDate = useCallback((date: Date) => {
    const items = getItemsForDate(date);
    const types = new Set(items.map((item) => item.type));
    return {
      hasEvents: types.has("events"),
      hasReminders: types.has("reminders"),
      hasLogs: types.has("logs"),
      hasSymptoms: types.has("symptoms"),
      hasTodos: types.has("todos"),
      hasAlarms: types.has("alarms"),
    };
  }, [getItemsForDate]);

  const filteredItems = useMemo(() => {
    if (!selectedDate) return [];
    const dayItems = getItemsForDate(selectedDate);
    
    if (activeFilters.has("all")) {
      return dayItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    
    return dayItems
      .filter((item) => activeFilters.has(item.type))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [selectedDate, allTimeItems, activeFilters, getItemsForDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayPress = (date: Date) => {
    Haptics.selectionAsync();
    setSelectedDate(date);
  };

  const handleFilterToggle = (filter: FilterType) => {
    Haptics.selectionAsync();
    setActiveFilters((prev) => {
      const newFilters = new Set(prev);
      
      if (filter === "all") {
        const newSet = new Set<FilterType>(["all"]);
        saveFilters(newSet);
        return newSet;
      }
      
      newFilters.delete("all");
      
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
        if (newFilters.size === 0) {
          newFilters.add("all");
        }
      } else {
        newFilters.add(filter);
      }
      
      saveFilters(newFilters);
      return newFilters;
    });
  };

  const openAddEventModal = (presetDate?: Date) => {
    if (presetDate) {
      setNewEventDate(presetDate);
    }
    setShowAddModal(true);
  };

  const handleAddEvent = () => {
    if (newEventTitle.trim()) {
      addCalendarEvent({
        title: newEventTitle.trim(),
        date: newEventDate,
        type: newEventType === "events" ? "event" : "reminder",
        recurring: null,
      });
      setNewEventTitle("");
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const filters: { id: FilterType; label: string; icon: string; color: string }[] = [
    { id: "all", label: "All", icon: "grid", color: theme.text },
    { id: "events", label: "Events", icon: "calendar", color: theme.primary },
    { id: "reminders", label: "Reminders", icon: "bell", color: theme.accent },
    { id: "logs", label: "Logs", icon: "check-circle", color: theme.success },
    { id: "symptoms", label: "Symptoms", icon: "activity", color: theme.secondary },
    { id: "todos", label: "To-Dos", icon: "check-square", color: theme.accent },
    { id: "alarms", label: "Alarms", icon: "clock", color: theme.accent },
  ];

  return (
    <ScreenScrollView>
      <Card elevation={1}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={handlePrevMonth} style={styles.navButton}>
            <Feather name="chevron-left" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">
            {MONTHS[currentMonth]} {currentYear}
          </ThemedText>
          <Pressable
            onPress={() => openAddEventModal(selectedDate || new Date())}
            style={[styles.addHeaderButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={handleNextMonth} style={styles.navButton}>
            <Feather name="chevron-right" size={24} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.weekDays}>
          {DAYS.map((day) => (
            <View key={day} style={styles.weekDay}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {day}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth;
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const indicators = getIndicatorsForDate(date);

            return (
              <Pressable
                key={index}
                onPress={() => handleDayPress(date)}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: theme.primary },
                  isToday && !isSelected && { backgroundColor: theme.surfaceVariant },
                ]}
              >
                <ThemedText
                  type="body"
                  style={[
                    styles.dayNumber,
                    !isCurrentMonth && { opacity: 0.3 },
                    isSelected && { color: "#FFFFFF" },
                  ]}
                >
                  {date.getDate()}
                </ThemedText>
                <View style={styles.indicators}>
                  {indicators.hasEvents ? (
                    <View style={[styles.indicator, { backgroundColor: theme.primary }]} />
                  ) : null}
                  {indicators.hasReminders ? (
                    <View style={[styles.indicator, { backgroundColor: theme.accent }]} />
                  ) : null}
                  {indicators.hasLogs ? (
                    <View style={[styles.indicator, { backgroundColor: theme.success }]} />
                  ) : null}
                  {indicators.hasSymptoms ? (
                    <View style={[styles.indicator, { backgroundColor: theme.secondary }]} />
                  ) : null}
                  {indicators.hasTodos ? (
                    <View style={[styles.indicator, { backgroundColor: theme.accent }]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Spacer height={Spacing.lg} />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filters.map((f) => {
          const isActive = activeFilters.has(f.id);
          return (
            <Pressable
              key={f.id}
              onPress={() => handleFilterToggle(f.id)}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: isActive ? f.color : theme.surfaceVariant,
                  borderWidth: 1,
                  borderColor: isActive ? f.color : theme.divider,
                },
              ]}
            >
              <Feather 
                name={f.icon as any} 
                size={14} 
                color={isActive ? "#FFFFFF" : theme.text} 
              />
              <ThemedText
                type="small"
                style={{ color: isActive ? "#FFFFFF" : theme.text, marginLeft: 4 }}
              >
                {f.label}
              </ThemedText>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => openAddEventModal(selectedDate || new Date())}
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </ScrollView>

      <Spacer height={Spacing.md} />

      {selectedDate ? (
        <Card elevation={1}>
          <View style={styles.selectedDateHeader}>
            <ThemedText type="h4">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </ThemedText>
            <Pressable
              onPress={() => openAddEventModal(selectedDate)}
              style={[styles.addInlineButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={14} color="#FFFFFF" />
              <ThemedText type="caption" style={{ color: "#FFFFFF", marginLeft: 6 }}>
                Add
              </ThemedText>
            </Pressable>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            </ThemedText>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="sun" size={32} color={theme.textSecondary} />
              <Spacer height={Spacing.sm} />
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                Nothing here yet. A quiet day ahead?
              </ThemedText>
            </View>
          ) : (
            <View style={styles.eventList}>
              {filteredItems.map((item) => (
                <View key={item.id} style={styles.eventItem}>
                  <View
                    style={[styles.eventIndicator, { backgroundColor: item.color }]}
                  />
                  <View style={styles.eventIcon}>
                    <Feather name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <View style={styles.eventContent}>
                    <ThemedText type="body">{item.title}</ThemedText>
                    <View style={styles.eventMeta}>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {new Date(item.timestamp).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </ThemedText>
                      {item.subtext ? (
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {" "}{item.subtext}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                  {item.id.startsWith("event-") ? (
                    <Pressable 
                      onPress={() => {
                        const eventId = item.id.replace("event-", "");
                        removeCalendarEvent(eventId);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Feather name="trash-2" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : item.id.startsWith("log-") ? (
                    <Pressable
                      onPress={() => {
                        const logId = item.id.replace("log-", "");
                        removeQuickLogEntry(logId);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Feather name="trash-2" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </Card>
      ) : (
        <Card elevation={1}>
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color={theme.textSecondary} />
            <Spacer height={Spacing.sm} />
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              Tap a day to see what's happening
            </ThemedText>
          </View>
        </Card>
      )}

      <Spacer height={Spacing.lg} />

      <Card elevation={1}>
        <View style={styles.legendSection}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>Legend</ThemedText>
          <View style={styles.legendGrid}>
            {filters.filter(f => f.id !== "all").map((f) => (
              <View key={f.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: f.color }]} />
                <ThemedText type="caption">{f.label}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </Card>

      <Spacer height={Spacing["4xl"]} />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Add Event</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize },
              ]}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              placeholder="What's happening?"
              placeholderTextColor={theme.textSecondary}
            />

            <View style={styles.typeRow}>
              <Pressable
                onPress={() => setNewEventType("events")}
                style={[
                  styles.typeButton,
                  { backgroundColor: newEventType === "events" ? theme.primary : theme.surfaceVariant },
                ]}
              >
                <Feather
                  name="calendar"
                  size={16}
                  color={newEventType === "events" ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{ color: newEventType === "events" ? "#FFFFFF" : theme.text }}
                >
                  Event
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setNewEventType("reminders")}
                style={[
                  styles.typeButton,
                  { backgroundColor: newEventType === "reminders" ? theme.accent : theme.surfaceVariant },
                ]}
              >
                <Feather
                  name="bell"
                  size={16}
                  color={newEventType === "reminders" ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{ color: newEventType === "reminders" ? "#FFFFFF" : theme.text }}
                >
                  Reminder
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateButton, { backgroundColor: theme.surfaceVariant }]}
            >
              <Feather name="calendar" size={18} color={theme.text} />
              <ThemedText type="body">
                {newEventDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </ThemedText>
            </Pressable>

            {showDatePicker ? (
              <DateTimePicker
                value={newEventDate}
                mode="datetime"
                display="spinner"
                onChange={(event: any, date: Date | undefined) => {
                  setShowDatePicker(false);
                  if (date) setNewEventDate(date);
                }}
              />
            ) : null}

            <Pressable
              onPress={handleAddEvent}
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Add Event
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  addHeaderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navButton: {
    padding: Spacing.sm,
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  dayNumber: {
    fontWeight: "500",
  },
  indicators: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 24,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addEventButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  addInlineButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  eventList: {
    gap: Spacing.sm,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  eventIndicator: {
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  eventContent: {
    flex: 1,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendSection: {
    paddingVertical: Spacing.sm,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
