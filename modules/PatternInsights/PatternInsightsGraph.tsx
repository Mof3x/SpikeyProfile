import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useAnalytics } from "@/core/AnalyticsContext";
import { FACTOR_GROUP_LABELS, type FactorGroup } from "@/core/analytics/types";
import type { CorrelationResult } from "@/core/analytics/correlations";
import { strengthDots } from "@/core/analytics/text";
import { Spacing, BorderRadius } from "@/constants/theme";

const MAX_SHOWN = 8;

function StrengthDots({
  rho,
  color,
  empty,
}: {
  rho: number;
  color: string;
  empty: string;
}) {
  const filled = strengthDots(rho);
  const label =
    filled === 3 ? "Strong link" : filled === 2 ? "Moderate link" : "Weak link";
  return (
    <View style={styles.dots} accessibilityLabel={label}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i <= filled ? color : empty }]}
        />
      ))}
    </View>
  );
}

export function PatternInsightsGraph() {
  const { theme } = useTheme();
  const { result, wordsFor, showNumbers } = useAnalytics();
  const { correlations, progress } = result;

  const grouped = useMemo(() => {
    const shown = correlations.results.slice(0, MAX_SHOWN);
    const groups = new Map<FactorGroup, CorrelationResult[]>();
    for (const c of shown)
      groups.set(c.factor.group, [...(groups.get(c.factor.group) ?? []), c]);
    return [...groups.entries()];
  }, [correlations.results]);

  const colorFor = (c: CorrelationResult) =>
    c.good ? theme.success : theme.accent;
  const needed = progress.patternDaysNeeded;
  const enoughDays = progress.daysLogged >= needed;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <Feather name="git-branch" size={18} color={theme.primary} />
          </View>
          <View>
            <ThemedText type="h3">Pattern Correlations</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              How your habits, body and surroundings connect
            </ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      {!enoughDays ? (
        <View>
          <ThemedText type="body">
            {showNumbers
              ? `${progress.daysLogged} of ${needed} days of check-ins so far.`
              : "Keep logging. Patterns start to appear after about two weeks of check-ins."}
          </ThemedText>
          <View
            style={[styles.progressTrack, { backgroundColor: theme.divider }]}
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: needed,
              now: progress.daysLogged,
            }}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (progress.daysLogged / needed) * 100)}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
        </View>
      ) : grouped.length === 0 ? (
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {showNumbers
            ? `${progress.testedCount} possible links checked across ${progress.analysableFactors} things you track. None were consistent enough to show yet.`
            : "Nothing stands out strongly yet. That's normal, and the app keeps checking as you log."}
        </ThemedText>
      ) : (
        grouped.map(([group, items], gi) => (
          <View
            key={group}
            style={gi > 0 ? { marginTop: Spacing.lg } : undefined}
          >
            <ThemedText
              type="caption"
              style={[styles.groupLabel, { color: theme.textSecondary }]}
            >
              {FACTOR_GROUP_LABELS[group].toUpperCase()}
            </ThemedText>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.correlationItem,
                  index > 0 && { marginTop: Spacing.sm },
                  { backgroundColor: theme.surfaceVariant },
                ]}
              >
                <View style={styles.correlationHeader}>
                  <View style={styles.factorPair}>
                    <ThemedText
                      type="body"
                      style={{ fontWeight: "600", flexShrink: 1 }}
                      numberOfLines={1}
                    >
                      {item.factor.label}
                    </ThemedText>
                    <Feather
                      name="arrow-right"
                      size={14}
                      color={theme.textSecondary}
                      style={{ marginHorizontal: Spacing.xs }}
                    />
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {item.symptom.label}
                    </ThemedText>
                  </View>
                  {showNumbers ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colorFor(item) + "20" },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{ color: colorFor(item), fontWeight: "600" }}
                      >
                        {item.confidence === "consistent"
                          ? "Consistent"
                          : "Early signal"}
                      </ThemedText>
                    </View>
                  ) : (
                    <StrengthDots
                      rho={item.rho}
                      color={colorFor(item)}
                      empty={theme.divider}
                    />
                  )}
                </View>
                <ThemedText
                  type="small"
                  style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                >
                  {wordsFor(item)}
                </ThemedText>
                {showNumbers ? (
                  <View
                    style={[
                      styles.correlationBar,
                      { backgroundColor: theme.divider },
                    ]}
                  >
                    <View
                      style={[
                        styles.correlationFill,
                        {
                          width: `${Math.abs(item.rho) * 100}%`,
                          backgroundColor: colorFor(item),
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))
      )}

      <Spacer height={Spacing.md} />

      <View style={[styles.infoBox, { backgroundColor: theme.primary + "10" }]}>
        <Feather name="info" size={14} color={theme.primary} />
        <ThemedText
          type="caption"
          style={{ color: theme.primary, marginLeft: Spacing.sm, flex: 1 }}
        >
          These are patterns in your own logs, not proof that one thing causes
          another. Only links that hold up across your data are shown, so
          coincidences are filtered out.
        </ThemedText>
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  groupLabel: {
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  correlationItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  correlationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  factorPair: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  dots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  correlationBar: {
    height: 4,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: "hidden",
  },
  correlationFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
