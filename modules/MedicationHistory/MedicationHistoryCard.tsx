import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

interface DayData {
  date: Date;
  logs: { id: string; name: string; time: Date }[];
  hasLogs: boolean;
}

export function MedicationHistoryCard() {
  const { theme } = useTheme();
  const { quickLogEntries, quickLogActions } = useData();

  const last7Days = useMemo(() => {
    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const medActions = quickLogActions.filter(
      (a) => a.category === "medication" && a.enabled
    );
    const medActionIds = new Set(medActions.map((a) => a.id));

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      const dayLogs = quickLogEntries
        .filter((entry) => {
          const entryDate = new Date(entry.timestamp).toDateString();
          return entryDate === dateStr && medActionIds.has(entry.actionId);
        })
        .map((entry) => ({
          id: entry.id,
          name: entry.actionName,
          time: new Date(entry.timestamp),
        }));

      days.push({ date, logs: dayLogs, hasLogs: dayLogs.length > 0 });
    }

    return days;
  }, [quickLogEntries, quickLogActions]);

  const daysWithLogs = last7Days.filter((d) => d.hasLogs).length;
  const totalLogs = last7Days.reduce((sum, d) => sum + d.logs.length, 0);

  const getStatusColor = (day: DayData) => {
    if (day.hasLogs) {
      return theme.success;
    }
    if (day.date.toDateString() === new Date().toDateString()) {
      return theme.textSecondary;
    }
    return theme.surfaceVariant;
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateNorm = new Date(date);
    dateNorm.setHours(0, 0, 0, 0);

    if (dateNorm.getTime() === today.getTime()) {
      return "Today";
    }

    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.error + "20" }]}>
            <Feather name="heart" size={18} color={theme.error} />
          </View>
          <ThemedText type="h3">Medication History</ThemedText>
        </View>
      </View>

      <View style={styles.weekView}>
        {last7Days.map((day) => (
          <View key={day.date.toISOString()} style={styles.dayColumn}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {getDayLabel(day.date)}
            </ThemedText>
            <View
              style={[
                styles.dayIndicator,
                {
                  backgroundColor: getStatusColor(day),
                  opacity: !day.hasLogs && day.date.toDateString() === new Date().toDateString() ? 0.4 : 1,
                },
              ]}
            >
              {day.hasLogs ? (
                <Feather name="check" size={14} color={theme.background} />
              ) : (
                <ThemedText type="small" style={{ color: theme.text, opacity: 0.6 }}>
                  {day.date.getDate()}
                </ThemedText>
              )}
            </View>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {day.logs.length}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={[styles.statsRow, { borderTopColor: theme.divider }]}>
        <View style={styles.stat}>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {totalLogs}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Total logged
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.stat}>
          <ThemedText type="h3" style={{ color: daysWithLogs > 0 ? theme.success : theme.textSecondary }}>
            {daysWithLogs}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Days with logs
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.cardPadding,
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
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  weekView: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  dayColumn: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  dayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
});
