import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function GamificationCard() {
  const { theme } = useTheme();
  const { userStats } = useData();

  const xpToNextLevel = (userStats.level * 100) - userStats.xp;
  const progressPercent = (userStats.xp % 100) / 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <View style={[styles.levelCircle, { backgroundColor: theme.accent }]}>
            <ThemedText type="body" style={styles.levelNumber}>
              {userStats.level}
            </ThemedText>
          </View>
          <View style={styles.levelInfo}>
            <ThemedText type="h4">Level {userStats.level}</ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
            >
              {userStats.xp} XP total
            </ThemedText>
          </View>
        </View>

        <View style={styles.streak}>
          <Feather name="zap" size={20} color={theme.accent} />
          <ThemedText type="h3" style={{ color: theme.accent }}>
            {userStats.currentStreak}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            day streak
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceVariant }]}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: theme.accent, width: `${progressPercent * 100}%` },
            ]}
          />
        </View>
        <ThemedText
          type="small"
          style={[styles.progressText, { color: theme.textSecondary }]}
        >
          {xpToNextLevel} XP to Level {userStats.level + 1}
        </ThemedText>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Feather name="check-circle" size={16} color={theme.success} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {userStats.totalEntries} entries
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <Feather name="award" size={16} color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Best: {userStats.longestStreak} days
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  levelInfo: {
    gap: 2,
  },
  streak: {
    alignItems: "center",
    gap: 2,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    textAlign: "right",
    opacity: 0.7,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
