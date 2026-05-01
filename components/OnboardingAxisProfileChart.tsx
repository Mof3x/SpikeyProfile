import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Polygon, Text as SvgText } from "react-native-svg";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { OnboardingAxisId } from "@/core/DataContext";
import {
  ONBOARDING_AXIS_LABELS,
  ONBOARDING_CHALLENGE_AXES,
} from "@/core/OnboardingFlowContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

const AXIS_ORDER: OnboardingAxisId[] = [
  "patternRecognition",
  "deepFocus",
  "creativity",
  "principledJudgement",
  "executiveFunction",
  "healthWellbeingSafety",
  "sensoryRegulation",
  "mobilityNavigationSocial",
];

interface OnboardingAxisProfileChartProps {
  scores: Record<OnboardingAxisId, number>;
}

const MAX_SCORE = 5;
const MIN_SCORE = 1;

const getAxisPoints = (axisId: OnboardingAxisId, rawScore: number) => {
  const safe = Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(rawScore)));
  if (ONBOARDING_CHALLENGE_AXES.includes(axisId)) {
    return MAX_SCORE + 1 - safe;
  }
  return safe;
};

const getShortLabel = (axisId: OnboardingAxisId) => {
  const full = ONBOARDING_AXIS_LABELS[axisId];
  return full.split(" ")[0] ?? full;
};

export function OnboardingAxisProfileChart({
  scores,
}: OnboardingAxisProfileChartProps) {
  const { theme } = useTheme();
  const availableWidth =
    Dimensions.get("window").width - Spacing.xl * 2 - Spacing.cardPadding * 2;
  const size = Math.max(200, Math.min(availableWidth, 240));
  const viewPadding = 100;
  const canvasSize = size + viewPadding * 2;
  const center = canvasSize / 2;
  const radius = size / 2 - 20;
  const axisCount = AXIS_ORDER.length;
  const angleStep = (Math.PI * 2) / axisCount;
  const startAngle = -Math.PI / 2;

  const axisMeta = AXIS_ORDER.map((axisId, i) => {
    const angle = startAngle + i * angleStep;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const labelRadius = radius + 30;
    const labelX = center + labelRadius * Math.cos(angle);
    const labelY = center + labelRadius * Math.sin(angle);
    const cos = Math.cos(angle);
    const textAnchor: "start" | "middle" | "end" =
      Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
    return {
      axisId,
      angle,
      x,
      y,
      labelX,
      labelY,
      textAnchor,
    };
  });

  const gridLevels = [1, 2, 3, 4, 5];
  const gridPolygons = gridLevels.map((level) => {
    const r = (radius * level) / MAX_SCORE;
    const points = axisMeta
      .map(({ angle }) => {
        const px = center + r * Math.cos(angle);
        const py = center + r * Math.sin(angle);
        return `${px},${py}`;
      })
      .join(" ");
    return { level, points };
  });

  const dataPoints = axisMeta.map(({ axisId, angle }) => {
    const raw = scores[axisId];
    const pointsValue = getAxisPoints(axisId, raw);
    const r = (radius * pointsValue) / MAX_SCORE;
    const px = center + r * Math.cos(angle);
    const py = center + r * Math.sin(angle);
    return { axisId, pointsValue, raw, x: px, y: py };
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Card style={styles.card}>
      <ThemedText type="h4">8-area profile snapshot</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Strengths add points; difficulties reduce points (display is inverted).
      </ThemedText>

      <View style={styles.chartWrap}>
        <View style={[styles.radarWrap, { width: size, height: size }]}>
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${canvasSize} ${canvasSize}`}
          >
            {gridPolygons.map((grid) => (
              <Polygon
                key={grid.level}
                points={grid.points}
                fill="transparent"
                stroke={theme.divider}
                strokeWidth={1}
              />
            ))}

            {axisMeta.map((axis) => (
              <Line
                key={axis.axisId}
                x1={center}
                y1={center}
                x2={axis.x}
                y2={axis.y}
                stroke={theme.divider}
                strokeWidth={1}
              />
            ))}

            <Polygon
              points={dataPolygon}
              fill={theme.primary + "33"}
              stroke={theme.primary}
              strokeWidth={2}
            />

            {dataPoints.map((p) => (
              <Circle
                key={p.axisId}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={theme.primary}
              />
            ))}

            {axisMeta.map((axis) => (
              <SvgText
                key={axis.axisId + ":label"}
                x={axis.labelX}
                y={axis.labelY}
                fill={theme.textSecondary}
                fontSize={20}
                fontWeight="600"
                textAnchor={axis.textAnchor}
                alignmentBaseline="middle"
              >
                {getShortLabel(axis.axisId)}
              </SvgText>
            ))}
          </Svg>
        </View>
      </View>

      <View style={styles.legend}>
        {AXIS_ORDER.map((axisId) => (
          <View key={axisId} style={styles.legendRow}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {ONBOARDING_AXIS_LABELS[axisId]}
            </ThemedText>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {getAxisPoints(axisId, scores[axisId])}/5
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  chartWrap: {
    alignItems: "center",
  },
  radarWrap: {
    position: "relative",
  },
  legend: {
    gap: Spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
