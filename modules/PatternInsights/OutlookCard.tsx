import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAnalytics } from "@/core/AnalyticsContext";
import type { TargetForecast } from "@/core/analytics/forecast";
import { fmt } from "@/core/analytics/text";
import { BorderRadius, Spacing } from "@/constants/theme";

interface OutlookCardProps {
  day: "today" | "tomorrow";
  compact?: boolean;
}

function direction(f: TargetForecast): "better" | "worse" | "usual" {
  const z = (f.value - f.personalMean) / f.personalSd;
  if (Math.abs(z) < 0.35) return "usual";
  const higherIsWorse = f.symptom?.higherIsWorse ?? true;
  return z > 0 === higherIsWorse ? "worse" : "better";
}

export function OutlookCard({ day, compact = false }: OutlookCardProps) {
  const { theme } = useTheme();
  const { result, wordsFor, showNumbers } = useAnalytics();
  const [showWhy, setShowWhy] = useState(false);

  const forecast =
    day === "today" ? result.forecastToday : result.forecastTomorrow;
  const tough = day === "today" ? result.toughToday : result.toughTomorrow;
  const title = day === "today" ? "Today's outlook" : "Tomorrow's outlook";

  const symptoms = useMemo(() => forecast?.symptoms ?? [], [forecast]);
  const modelled = symptoms.some((s) => s.method === "model");

  const reasons = useMemo(() => {
    const seen = new Map<string, boolean>();
    for (const f of [forecast?.load, ...symptoms]) {
      for (const d of f?.drivers ?? [])
        if (!seen.has(d.text)) seen.set(d.text, d.worsens);
    }
    return [...seen.entries()].slice(0, 4);
  }, [forecast, symptoms]);

  const colorFor = (dir: ReturnType<typeof direction>) =>
    dir === "worse"
      ? theme.accent
      : dir === "better"
        ? theme.success
        : theme.textSecondary;

  if (symptoms.length === 0) {
    if (compact) return null;
    return (
      <Card style={styles.card}>
        <Header title={title} />
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {day === "tomorrow"
            ? "Log today's check-in to see tomorrow's outlook."
            : "Your outlook appears once you've logged a few days."}
        </ThemedText>
      </Card>
    );
  }

  const notable = compact
    ? [...symptoms]
        .sort(
          (a, b) =>
            Math.abs((b.value - b.personalMean) / b.personalSd) -
            Math.abs((a.value - a.personalMean) / a.personalSd),
        )
        .slice(0, 3)
    : symptoms;

  return (
    <Card style={styles.card}>
      <Header title={title} />

      {tough?.warn ? (
        <View style={[styles.banner, { backgroundColor: theme.accent + "20" }]}>
          <Feather name="cloud-drizzle" size={18} color={theme.accent} />
          <ThemedText
            type="body"
            style={{ color: theme.text, flex: 1, marginLeft: Spacing.sm }}
          >
            {wordsFor(tough)}
          </ThemedText>
        </View>
      ) : null}

      <View style={compact ? styles.chipRow : undefined}>
        {notable.map((f) => {
          const dir = direction(f);
          return compact ? (
            <View
              key={f.target}
              style={[styles.chip, { backgroundColor: colorFor(dir) + "20" }]}
            >
              <ThemedText
                type="small"
                style={{ color: theme.text, fontWeight: "600" }}
              >
                {f.label}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colorFor(dir) }}>
                {showNumbers ? `≈${fmt(f.value, 0)}/10` : f.word}
              </ThemedText>
            </View>
          ) : (
            <View
              key={f.target}
              style={[styles.row, { borderBottomColor: theme.divider }]}
            >
              <View
                style={[styles.marker, { backgroundColor: colorFor(dir) }]}
              />
              <ThemedText type="body" style={{ flex: 1 }}>
                {f.label}
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: colorFor(dir), fontWeight: "600" }}
              >
                {showNumbers
                  ? `≈${fmt(f.value, 0)} (${fmt(f.low, 0)}–${fmt(f.high, 0)})`
                  : f.word}
              </ThemedText>
            </View>
          );
        })}
      </View>

      {!compact ? (
        <>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setShowWhy((v) => !v);
            }}
            style={styles.whyButton}
            accessibilityRole="button"
          >
            <Feather
              name={showWhy ? "chevron-down" : "chevron-right"}
              size={16}
              color={theme.primary}
            />
            <ThemedText
              type="small"
              style={{ color: theme.primary, fontWeight: "600" }}
            >
              Why?
            </ThemedText>
          </Pressable>
          {showWhy ? (
            <View style={styles.why}>
              {!modelled ? (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  This is based on your usual levels. The app only makes a
                  fuller prediction once it has proved more accurate than that
                  on your past days.
                </ThemedText>
              ) : reasons.length ? (
                reasons.map(([text, worsens]) => (
                  <View key={text} style={styles.reason}>
                    <Feather
                      name={worsens ? "trending-down" : "trending-up"}
                      size={14}
                      color={worsens ? theme.accent : theme.success}
                    />
                    <ThemedText type="small" style={{ flex: 1 }}>
                      {text}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Nothing unusual is pushing this up or down.
                </ThemedText>
              )}
              {showNumbers && forecast ? (
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
                >
                  {symptoms
                    .filter(
                      (s) => s.method === "model" && s.modelMae !== undefined,
                    )
                    .map(
                      (s) =>
                        `${s.label}: off by ±${fmt(s.modelMae!, 2)} on average vs ±${fmt(s.baselineMae!, 2)} for your usual level`,
                    )
                    .join(" · ") ||
                    `Learning from ${forecast.trainingDays} days of check-ins`}
                </ThemedText>
              ) : null}
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
              >
                A guess from your own past days, to help you plan gently. It can
                be wrong.
              </ThemedText>
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function Header({ title }: { title: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.header}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.primary + "20" },
        ]}
      >
        <Feather name="sunrise" size={18} color={theme.primary} />
      </View>
      <ThemedText type="h4">{title}</ThemedText>
    </View>
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
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  whyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    minHeight: 32,
  },
  why: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
