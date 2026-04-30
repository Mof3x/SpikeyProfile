import React from "react";
import { StyleSheet, View, Pressable } from "react-native";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { OnboardingQuestion } from "@/core/OnboardingFlowContext";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface OnboardingLikertQuestionProps {
  question: OnboardingQuestion;
  value: number;
  onChange: (score: number) => void;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

export function OnboardingLikertQuestion({
  question,
  value,
  onChange,
}: OnboardingLikertQuestionProps) {
  const { theme } = useTheme();

  return (
    <Card style={styles.card}>
      <ThemedText type="h4">{question.title}</ThemedText>
      <ThemedText
        type="small"
        style={[styles.prompt, { color: theme.textSecondary }]}
      >
        {question.prompt}
      </ThemedText>

      <View style={styles.row}>
        {SCORE_OPTIONS.map((score) => {
          const active = value === score;
          return (
            <Pressable
              key={score}
              onPress={() => onChange(score)}
              style={[
                styles.scoreChip,
                {
                  backgroundColor: active
                    ? theme.primary
                    : theme.surfaceVariant,
                  borderColor: active ? theme.primary : theme.divider,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={{
                  color: active ? "#FFFFFF" : theme.text,
                  fontWeight: "600",
                }}
              >
                {score}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.scaleLabels}>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {question.options[0]}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.scaleRight, { color: theme.textSecondary }]}
        >
          {question.options[question.options.length - 1]}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  prompt: {
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scoreChip: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  scaleLabels: {
    gap: Spacing.xs,
  },
  scaleRight: {
    textAlign: "right",
  },
});
