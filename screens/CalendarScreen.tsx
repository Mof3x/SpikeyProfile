import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";

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

type FilterType = "all" | "reminder" | "event" | "symptom";

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
  const { calendarEvents, addCalendarEvent, removeCalendarEvent, symptomEntries } = useData();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"reminder" | "event">("event");
  const [newEventDate, setNewEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const days = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return calendarEvents.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const hasSymptomEntry = (date: Date): boolean => {
    return symptomEntries.some((e) => {
      const entryDate = new Date(e.timestamp);
      return entryDate.toDateString() === date.toDateString();
    });
  };

  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayEvents = getEventsForDate(selectedDate);
    if (filter === "all") return dayEvents;
    return dayEvents.filter((e) => e.type === filter);
  }, [selectedDate, calendarEvents, filter]);

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

  const handleAddEvent = () => {
    if (newEventTitle.trim()) {
      addCalendarEvent({
        title: newEventTitle.trim(),
        date: newEventDate,
        type: newEventType,
        recurring: null,
      });
      setNewEventTitle("");
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const typeColors = {
    reminder: theme.accent,
    event: theme.primary,
    symptom: theme.secondary,
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "event", label: "Events" },
    { id: "reminder", label: "Reminders" },
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
            const events = getEventsForDate(date);
            const hasSymptom = hasSymptomEntry(date);

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
                  {events.length > 0 ? (
                    <View style={[styles.indicator, { backgroundColor: theme.primary }]} />
                  ) : null}
                  {hasSymptom ? (
                    <View style={[styles.indicator, { backgroundColor: theme.secondary }]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Spacer height={Spacing.lg} />

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[
              styles.filterButton,
              { backgroundColor: filter === f.id ? theme.primary : theme.surfaceVariant },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: filter === f.id ? "#FFFFFF" : theme.text }}
            >
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            if (selectedDate) {
              setNewEventDate(selectedDate);
            }
            setShowAddModal(true);
          }}
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

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
          </View>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Nothing scheduled. A quiet day ahead?
              </ThemedText>
            </View>
          ) : (
            <View style={styles.eventList}>
              {filteredEvents.map((event) => (
                <View key={event.id} style={styles.eventItem}>
                  <View
                    style={[styles.eventIndicator, { backgroundColor: typeColors[event.type] }]}
                  />
                  <View style={styles.eventContent}>
                    <ThemedText type="body">{event.title}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {new Date(event.date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removeCalendarEvent(event.id)}>
                    <Feather name="trash-2" size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>
      ) : (
        <Card elevation={1}>
          <View style={styles.emptyState}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Tap a day to see what's happening
            </ThemedText>
          </View>
        </Card>
      )}

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
                onPress={() => setNewEventType("event")}
                style={[
                  styles.typeButton,
                  { backgroundColor: newEventType === "event" ? theme.primary : theme.surfaceVariant },
                ]}
              >
                <Feather
                  name="calendar"
                  size={16}
                  color={newEventType === "event" ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{ color: newEventType === "event" ? "#FFFFFF" : theme.text }}
                >
                  Event
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setNewEventType("reminder")}
                style={[
                  styles.typeButton,
                  { backgroundColor: newEventType === "reminder" ? theme.accent : theme.surfaceVariant },
                ]}
              >
                <Feather
                  name="bell"
                  size={16}
                  color={newEventType === "reminder" ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="small"
                  style={{ color: newEventType === "reminder" ? "#FFFFFF" : theme.text }}
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
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
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
    marginLeft: "auto",
  },
  selectedDateHeader: {
    marginBottom: Spacing.md,
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
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  eventIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
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
