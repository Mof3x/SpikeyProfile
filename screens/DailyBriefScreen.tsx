import React, { useMemo } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { useModules } from "@/core/ModuleContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function DailyBriefScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { isModuleEnabled } = useModules();
  const {
    todos,
    calendarEvents,
    quickLogEntries,
    alarmSchedules,
    countdownTimers,
    symptomEntries,
    userName,
  } = useData();

  const today = new Date();
  const todayStr = today.toDateString();

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todaysTodos = useMemo(() => {
    return todos.filter((t) => {
      if (t.completed) return false;
      if (t.dueDate) {
        return new Date(t.dueDate).toDateString() === todayStr;
      }
      return true;
    }).slice(0, 5);
  }, [todos, todayStr]);

  const todaysEvents = useMemo(() => {
    return calendarEvents.filter((e) => {
      const eventDate = new Date(e.date).toDateString();
      return eventDate === todayStr && !e.completed;
    }).slice(0, 3);
  }, [calendarEvents, todayStr]);

  const activeAlarms = useMemo(() => {
    return alarmSchedules.filter((a) => a.enabled).slice(0, 3);
  }, [alarmSchedules]);

  const upcomingCountdowns = useMemo(() => {
    const now = new Date().getTime();
    return countdownTimers
      .filter((t) => {
        if (!t.enabled) return false;
        const target = new Date(t.targetDate).getTime();
        const diffHours = (target - now) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      })
      .slice(0, 3);
  }, [countdownTimers]);

  const todaysMedLogs = useMemo(() => {
    return quickLogEntries.filter((entry) => {
      const entryDate = new Date(entry.timestamp).toDateString();
      return entryDate === todayStr && entry.actionName.toLowerCase().includes("med");
    });
  }, [quickLogEntries, todayStr]);

  const hasLoggedToday = symptomEntries.some(
    (e) => new Date(e.timestamp).toDateString() === todayStr
  );

  const displayName = userName || "there";

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">{getGreeting()}, {displayName}</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <Card style={{ padding: Spacing.lg }}>
        <View style={styles.sectionHeader}>
          <Feather name="check-square" size={20} color={theme.primary} />
          <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Today's Tasks</ThemedText>
        </View>
        <Spacer height={Spacing.md} />
        {todaysTodos.length === 0 ? (
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            No tasks for today. Enjoy your day!
          </ThemedText>
        ) : (
          todaysTodos.map((todo, index) => (
            <View key={todo.id} style={[styles.listItem, index > 0 && { marginTop: Spacing.sm }]}>
              <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
              <ThemedText type="body" numberOfLines={1} style={{ flex: 1 }}>
                {todo.text}
              </ThemedText>
            </View>
          ))
        )}
        {todos.filter((t) => !t.completed).length > 5 ? (
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              +{todos.filter((t) => !t.completed).length - 5} more tasks on Home
            </ThemedText>
          </View>
        ) : null}
      </Card>

      <Spacer height={Spacing.lg} />

      <Card style={{ padding: Spacing.lg }}>
        <View style={styles.sectionHeader}>
          <Feather name="heart" size={20} color={theme.error} />
          <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Medication Check</ThemedText>
        </View>
        <Spacer height={Spacing.md} />
        {todaysMedLogs.length === 0 ? (
          <View style={[styles.warningBox, { backgroundColor: theme.accent + "15" }]}>
            <Feather name="alert-circle" size={16} color={theme.accent} />
            <ThemedText type="body" style={{ color: theme.accent, marginLeft: Spacing.sm }}>
              No medications logged today yet
            </ThemedText>
          </View>
        ) : (
          <View>
            {todaysMedLogs.map((log, index) => (
              <View key={log.id} style={[styles.listItem, index > 0 && { marginTop: Spacing.sm }]}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                  {log.actionName} at {new Date(log.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </Card>

      <Spacer height={Spacing.lg} />

      {todaysEvents.length > 0 ? (
        <>
          <Card style={{ padding: Spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Feather name="calendar" size={20} color={theme.accent} />
              <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Today's Events</ThemedText>
            </View>
            <Spacer height={Spacing.md} />
            {todaysEvents.map((event, index) => (
              <View key={event.id} style={[styles.listItem, index > 0 && { marginTop: Spacing.sm }]}>
                <View style={[styles.bullet, { backgroundColor: theme.accent }]} />
                <ThemedText type="body" numberOfLines={1} style={{ flex: 1 }}>
                  {event.title}
                </ThemedText>
              </View>
            ))}
          </Card>
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      {upcomingCountdowns.length > 0 ? (
        <>
          <Card style={{ padding: Spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={20} color={theme.primary} />
              <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Coming Up Soon</ThemedText>
            </View>
            <Spacer height={Spacing.md} />
            {upcomingCountdowns.map((timer, index) => {
              const target = new Date(timer.targetDate);
              const hoursLeft = Math.round((target.getTime() - Date.now()) / (1000 * 60 * 60));
              return (
                <View key={timer.id} style={[styles.listItem, index > 0 && { marginTop: Spacing.sm }]}>
                  <Feather name={timer.icon as any} size={16} color={timer.color} />
                  <ThemedText type="body" style={{ marginLeft: Spacing.sm, flex: 1 }} numberOfLines={1}>
                    {timer.name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {hoursLeft}h left
                  </ThemedText>
                </View>
              );
            })}
          </Card>
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      <Card style={{ padding: Spacing.lg }}>
        <View style={styles.sectionHeader}>
          <Feather name="activity" size={20} color={theme.primary} />
          <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Daily Check-In</ThemedText>
        </View>
        <Spacer height={Spacing.md} />
        {hasLoggedToday ? (
          <View style={[styles.successBox, { backgroundColor: theme.success + "20" }]}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <ThemedText type="body" style={{ color: theme.success, marginLeft: Spacing.sm }}>
              You've logged your symptoms today!
            </ThemedText>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              navigation.getParent()?.navigate("TrackTab");
            }}
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="edit-3" size={16} color={theme.background} />
            <ThemedText type="body" style={{ color: theme.background, marginLeft: Spacing.sm, fontWeight: "600" }}>
              Log how you're feeling
            </ThemedText>
          </Pressable>
        )}
      </Card>

      <Spacer height={Spacing.lg} />

      {activeAlarms.length > 0 ? (
        <>
          <Card style={{ padding: Spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Feather name="bell" size={20} color={theme.accent} />
              <ThemedText type="h4" style={{ marginLeft: Spacing.sm }}>Active Reminders</ThemedText>
            </View>
            <Spacer height={Spacing.md} />
            {activeAlarms.map((alarm, index) => (
              <View key={alarm.id} style={[styles.listItem, index > 0 && { marginTop: Spacing.sm }]}>
                <Feather name="bell" size={16} color={theme.accent} />
                <ThemedText type="body" style={{ marginLeft: Spacing.sm, flex: 1 }} numberOfLines={1}>
                  {alarm.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {alarm.numberOfAlarms} reminder{alarm.numberOfAlarms !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            ))}
          </Card>
          <Spacer height={Spacing.lg} />
        </>
      ) : null}

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
