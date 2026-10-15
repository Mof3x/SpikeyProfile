import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAnalytics } from "@/core/AnalyticsContext";
import { BorderRadius, Spacing } from "@/constants/theme";

/** Routines, when you tend to go quiet, and what usually comes before it. */
export function LoggingPatternsCard() {
  const { theme } = useTheme();
  const { result, wordsFor } = useAnalytics();
  const { routines, leadUps, biasWarning, spells } = result.engagement;
  const driftPatterns = result.drift.filter((d) => d.patternInsight);
  const nothingYet =
    routines.length === 0 &&
    leadUps.length === 0 &&
    !biasWarning &&
    driftPatterns.length === 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primary + "20" },
          ]}
        >
          <Feather name="repeat" size={18} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="h4">Your logging patterns</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Gaps in logging are information too
          </ThemedText>
        </View>
      </View>

      {nothingYet ? (
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          After a few weeks, this shows your routines and what tends to come
          before quieter spells, like being unwell, your period, or a stretch of
          feeling great.
        </ThemedText>
      ) : null}

      {routines.slice(0, 4).map((r) => (
        <Line
          key={r.id}
          icon="check-circle"
          color={theme.success}
          text={wordsFor(r)}
        />
      ))}
      {leadUps.map((l) => (
        <Line
          key={l.id}
          icon="pause-circle"
          color={theme.primary}
          text={wordsFor(l)}
        />
      ))}
      {driftPatterns.map((d) => (
        <Line
          key={d.actionId}
          icon="heart"
          color={theme.accent}
          text={wordsFor(d.patternInsight!)}
        />
      ))}
      {biasWarning ? (
        <Line icon="info" color={theme.accent} text={wordsFor(biasWarning)} />
      ) : null}

      {spells.length > 0 ? (
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, marginTop: Spacing.md }}
        >
          Quiet days aren’t counted as “good” or “bad”; they’re left out of your
          averages and studied separately.
        </ThemedText>
      ) : null}
    </Card>
  );
}

function Line({
  icon,
  color,
  text,
}: {
  icon: string;
  color: string;
  text: string;
}) {
  return (
    <View style={styles.line}>
      <Feather
        name={icon as any}
        size={16}
        color={color}
        style={{ marginTop: 2 }}
      />
      <ThemedText type="small" style={{ flex: 1 }}>
        {text}
      </ThemedText>
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
  line: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
