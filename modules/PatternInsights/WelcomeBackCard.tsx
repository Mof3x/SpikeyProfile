import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAnalytics } from "@/core/AnalyticsContext";
import { useData, type DayNoteReason } from "@/core/DataContext";
import { addDays } from "@/core/analytics/dates";
import { describeSpell } from "@/core/analytics/engagement";
import { BorderRadius, Spacing } from "@/constants/theme";

const REASONS: { id: DayNoteReason; label: string; icon: string }[] = [
  { id: "unwell", label: "Unwell", icon: "thermometer" },
  { id: "period", label: "Period", icon: "droplet" },
  { id: "busy", label: "Busy or away", icon: "briefcase" },
  { id: "lowMood", label: "Low energy or mood", icon: "cloud" },
  { id: "feltGreat", label: "Felt great", icon: "sun" },
  { id: "justDidnt", label: "Just didn't", icon: "minus-circle" },
];

const OVERALL = [
  { value: 1, label: "Very rough" },
  { value: 2, label: "Rough" },
  { value: 3, label: "OK" },
  { value: 4, label: "Good" },
  { value: 5, label: "Very good" },
];

/** After two or more days without logging, asks (once, gently) why — one tap is enough. */
export function WelcomeBackCard() {
  const { theme } = useTheme();
  const { result } = useAnalytics();
  const { saveDayNotes } = useData();
  const spell = result.engagement.welcomeBack;

  const inferred = useMemo(
    () =>
      new Set(
        spell?.reasons.filter((r) => r.inferred).map((r) => r.reason) ?? [],
      ),
    [spell],
  );
  const [selected, setSelected] = useState<Set<DayNoteReason>>(new Set());
  const [overall, setOverall] = useState<number | undefined>();
  useEffect(() => setSelected(new Set(inferred)), [inferred]);

  if (!spell) return null;

  const days: string[] = [];
  for (let d = spell.start; d <= spell.end; d = addDays(d, 1)) days.push(d);

  const toggle = (id: DayNoteReason) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = (skip: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveDayNotes(
      days,
      skip ? { reasons: [] } : { reasons: [...selected], overall },
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Feather name="coffee" size={18} color={theme.primary} />
        <ThemedText type="h4" style={{ flex: 1 }}>
          Welcome back
        </ThemedText>
      </View>
      <ThemedText type="body">
        Looks like you had a break ({describeSpell(spell)}). Want to note why?
      </ThemedText>
      <ThemedText
        type="caption"
        style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
      >
        Optional. It helps the app understand quiet days instead of guessing.
      </ThemedText>

      <View style={styles.chips}>
        {REASONS.map((r) => {
          const on = selected.has(r.id);
          return (
            <Pressable
              key={r.id}
              onPress={() => toggle(r.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[
                styles.chip,
                { backgroundColor: on ? theme.primary : theme.surfaceVariant },
              ]}
            >
              <Feather
                name={r.icon as any}
                size={14}
                color={on ? theme.buttonText : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={{ color: on ? theme.buttonText : theme.text }}
              >
                {r.label}
                {inferred.has(r.id) ? " (probably)" : ""}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.md }}
      >
        Overall, those days were…
      </ThemedText>
      <View style={styles.overallRow}>
        {OVERALL.map((o) => {
          const on = overall === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => {
                Haptics.selectionAsync();
                setOverall(on ? undefined : o.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.label}
              style={[
                styles.overall,
                { backgroundColor: on ? theme.primary : theme.surfaceVariant },
              ]}
            >
              <ThemedText
                type="caption"
                style={{
                  color: on ? theme.buttonText : theme.text,
                  textAlign: "center",
                }}
              >
                {o.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => save(true)}
          style={[styles.action, { backgroundColor: theme.surfaceVariant }]}
        >
          <ThemedText type="body">Skip</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => save(false)}
          style={[styles.action, { backgroundColor: theme.primary, flex: 2 }]}
        >
          <ThemedText
            type="body"
            style={{ color: theme.buttonText, fontWeight: "600" }}
          >
            Save
          </ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 40,
    borderRadius: BorderRadius.full,
  },
  overallRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  overall: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
