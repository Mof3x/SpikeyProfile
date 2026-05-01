import React from "react";
import { StyleSheet, View } from "react-native";
import Slider from "@react-native-community/slider";

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

const MIN_SCORE = 1;
const MAX_SCORE = 5;

export function OnboardingLikertQuestion({
  question,
  value,
  onChange,
}: OnboardingLikertQuestionProps) {
  const { theme } = useTheme();

  const lowLabel = question.options[0] ?? "";
  const highLabel = question.options[question.options.length - 1] ?? "";

  return (
    <Card style={styles.card}>
      <ThemedText type="h3">{question.title}</ThemedText>
      <ThemedText
        type="body"
        style={[styles.prompt, { color: theme.textSecondary }]}
      >
        {question.prompt}
      </ThemedText>

      <View style={styles.sliderRow}>
        <View style={styles.sliderCol}>
          <ThemedText
            type="small"
            style={[styles.endpointLabel, { color: theme.textSecondary }]}
          >
            {MAX_SCORE} — {highLabel}
          </ThemedText>

          <View style={styles.sliderWrap}>
            <Slider
              value={value}
              minimumValue={MIN_SCORE}
              maximumValue={MAX_SCORE}
              step={1}
              onValueChange={onChange}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.divider}
              thumbTintColor={theme.primary}
              style={styles.slider}
            />
          </View>

          <ThemedText
            type="small"
            style={[styles.endpointLabel, { color: theme.textSecondary }]}
          >
            {MIN_SCORE} — {lowLabel}
          </ThemedText>
        </View>

        <View style={styles.valuePillWrap}>
          <View
            style={[
              styles.valuePill,
              {
                backgroundColor: theme.surfaceVariant,
                borderColor: theme.divider,
              },
            ]}
          >
            <ThemedText type="h3" style={{ fontWeight: "700" }}>
              {value}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              /{MAX_SCORE}
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  prompt: {
    lineHeight: 22,
  },
  endpointLabel: {
    textAlign: "center",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.lg,
  },
  sliderCol: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  sliderWrap: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  slider: {
    width: 200,
    height: 44,
    transform: [{ rotate: "-90deg" }],
  },
  valuePillWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  valuePill: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
