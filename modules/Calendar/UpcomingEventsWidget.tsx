import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData, CalendarEvent } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

function formatEventDate(date: Date): string {
  const now = new Date();
  const eventDate = new Date(date);
  const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return eventDate.toLocaleDateString("en-US", { weekday: "long" });
  return eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEventTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function EventItem({ event }: { event: CalendarEvent }) {
  const { theme } = useTheme();

  const typeColors = {
    reminder: theme.accent,
    event: theme.primary,
    symptom: theme.secondary,
  };

  const typeIcons = {
    reminder: "bell",
    event: "calendar",
    symptom: "activity",
  };

  return (
    <View style={styles.eventItem}>
      <View
        style={[
          styles.eventIndicator,
          { backgroundColor: typeColors[event.type] },
        ]}
      />
      <View style={styles.eventContent}>
        <ThemedText type="body" numberOfLines={1}>
          {event.title}
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {formatEventDate(new Date(event.date))} at {formatEventTime(new Date(event.date))}
        </ThemedText>
      </View>
      <Feather
        name={typeIcons[event.type] as any}
        size={16}
        color={theme.textSecondary}
      />
    </View>
  );
}

export function UpcomingEventsWidget() {
  const { theme } = useTheme();
  const { calendarEvents } = useData();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const now = new Date();
  const upcomingEvents = calendarEvents
    .filter((e) => new Date(e.date) >= now && !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <Pressable onPress={() => navigation.navigate("Calendar")}>
      <Card elevation={1}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="calendar" size={18} color={theme.accent} />
            </View>
            <ThemedText type="h4">Coming Up</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>

        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              No upcoming events. Enjoying some free time?
            </ThemedText>
          </View>
        ) : (
          <View style={styles.eventList}>
            {upcomingEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
  emptyState: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  eventList: {
    gap: Spacing.sm,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  eventIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
});
