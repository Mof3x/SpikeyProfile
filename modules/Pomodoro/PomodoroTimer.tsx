import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, Pressable, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { useModules } from "@/core/ModuleContext";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TimerSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

const BACKGROUNDS = [
  { id: "default", name: "Default", color: null, xpRequired: 0 },
  { id: "ocean", name: "Ocean", color: "#1A4B6E", xpRequired: 0 },
  { id: "forest", name: "Forest", color: "#1E3A2F", xpRequired: 100 },
  { id: "sunset", name: "Sunset", color: "#4A2C1A", xpRequired: 200 },
  { id: "lavender", name: "Lavender", color: "#2A1E3E", xpRequired: 300 },
  { id: "midnight", name: "Midnight", color: "#0A0A1A", xpRequired: 500 },
];

export function PomodoroTimerCard() {
  const { theme, typography } = useTheme();
  const { userStats } = useData();
  const { isModuleEnabled } = useModules();
  const gamificationEnabled = isModuleEnabled("gamification");

  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [selectedBackground, setSelectedBackground] = useState("default");
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progress = useSharedValue(1);

  const totalTime = isBreak
    ? (sessionsCompleted % settings.sessionsBeforeLongBreak === 0
        ? settings.longBreakMinutes
        : settings.breakMinutes) * 60
    : settings.workMinutes * 60;

  useEffect(() => {
    progress.value = withTiming(timeLeft / totalTime, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [timeLeft, totalTime]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(false);

    if (!isBreak) {
      setSessionsCompleted((prev) => prev + 1);
      const isLongBreak = (sessionsCompleted + 1) % settings.sessionsBeforeLongBreak === 0;
      setTimeLeft(isLongBreak ? settings.longBreakMinutes * 60 : settings.breakMinutes * 60);
      setIsBreak(true);
    } else {
      setTimeLeft(settings.workMinutes * 60);
      setIsBreak(false);
    }
  }, [isBreak, sessionsCompleted, settings]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(settings.workMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const currentBg = BACKGROUNDS.find((b) => b.id === selectedBackground);
  const unlockedBackgrounds = BACKGROUNDS.filter(
    (b) => !gamificationEnabled || userStats.xp >= b.xpRequired
  );

  return (
    <>
      <Card
        elevation={1}
        style={currentBg?.color ? { backgroundColor: currentBg.color } : undefined}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="clock" size={18} color={theme.primary} />
            </View>
            <View>
              <ThemedText type="h4">Pomodoro</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {sessionsCompleted} sessions today
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={({ pressed }) => [
              styles.settingsButton,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="settings" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.timerContainer}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {isBreak ? "Break Time" : "Focus Time"}
          </ThemedText>
          <ThemedText style={[styles.timerDisplay, { fontSize: typography.h1.fontSize * 2 }]}>
            {formatTime(timeLeft)}
          </ThemedText>

          <View style={[styles.progressBar, { backgroundColor: theme.surfaceVariant }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: isBreak ? theme.secondary : theme.primary },
                progressStyle,
              ]}
            />
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={resetTimer}
            style={[styles.controlButton, { backgroundColor: theme.surfaceVariant }]}
          >
            <Feather name="rotate-ccw" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={toggleTimer}
            style={[
              styles.playButton,
              { backgroundColor: isBreak ? theme.secondary : theme.primary },
            ]}
          >
            <Feather name={isRunning ? "pause" : "play"} size={28} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => {
              setIsBreak(!isBreak);
              setTimeLeft(
                isBreak ? settings.workMinutes * 60 : settings.breakMinutes * 60
              );
              setIsRunning(false);
            }}
            style={[styles.controlButton, { backgroundColor: theme.surfaceVariant }]}
          >
            <Feather name="skip-forward" size={20} color={theme.text} />
          </Pressable>
        </View>
      </Card>

      <Modal
        visible={showSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Timer Settings</ThemedText>
              <Pressable onPress={() => setShowSettings(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.settingRow}>
              <ThemedText type="body">Work Duration</ThemedText>
              <View style={styles.settingControl}>
                <Pressable
                  onPress={() =>
                    setSettings((s) => ({ ...s, workMinutes: Math.max(5, s.workMinutes - 5) }))
                  }
                  style={[styles.adjustButton, { backgroundColor: theme.surfaceVariant }]}
                >
                  <Feather name="minus" size={16} color={theme.text} />
                </Pressable>
                <ThemedText type="body" style={styles.settingValue}>
                  {settings.workMinutes} min
                </ThemedText>
                <Pressable
                  onPress={() =>
                    setSettings((s) => ({ ...s, workMinutes: Math.min(60, s.workMinutes + 5) }))
                  }
                  style={[styles.adjustButton, { backgroundColor: theme.surfaceVariant }]}
                >
                  <Feather name="plus" size={16} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.settingRow}>
              <ThemedText type="body">Break Duration</ThemedText>
              <View style={styles.settingControl}>
                <Pressable
                  onPress={() =>
                    setSettings((s) => ({ ...s, breakMinutes: Math.max(1, s.breakMinutes - 1) }))
                  }
                  style={[styles.adjustButton, { backgroundColor: theme.surfaceVariant }]}
                >
                  <Feather name="minus" size={16} color={theme.text} />
                </Pressable>
                <ThemedText type="body" style={styles.settingValue}>
                  {settings.breakMinutes} min
                </ThemedText>
                <Pressable
                  onPress={() =>
                    setSettings((s) => ({ ...s, breakMinutes: Math.min(30, s.breakMinutes + 1) }))
                  }
                  style={[styles.adjustButton, { backgroundColor: theme.surfaceVariant }]}
                >
                  <Feather name="plus" size={16} color={theme.text} />
                </Pressable>
              </View>
            </View>

            {gamificationEnabled ? (
              <>
                <ThemedText
                  type="small"
                  style={[styles.sectionLabel, { color: theme.textSecondary }]}
                >
                  Background Theme (Unlock with XP)
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.backgroundRow}>
                    {BACKGROUNDS.map((bg) => {
                      const isUnlocked = userStats.xp >= bg.xpRequired;
                      const isSelected = selectedBackground === bg.id;
                      return (
                        <Pressable
                          key={bg.id}
                          onPress={() => isUnlocked && setSelectedBackground(bg.id)}
                          style={[
                            styles.backgroundOption,
                            {
                              backgroundColor: bg.color || theme.backgroundDefault,
                              borderColor: isSelected ? theme.primary : "transparent",
                              borderWidth: 3,
                              opacity: isUnlocked ? 1 : 0.4,
                            },
                          ]}
                        >
                          {!isUnlocked ? (
                            <View style={styles.lockedOverlay}>
                              <Feather name="lock" size={16} color="#FFFFFF" />
                              <ThemedText type="caption" style={{ color: "#FFFFFF" }}>
                                {bg.xpRequired} XP
                              </ThemedText>
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            ) : null}

            <Pressable
              onPress={() => {
                setTimeLeft(settings.workMinutes * 60);
                setShowSettings(false);
              }}
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Apply Settings
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  timerDisplay: {
    fontWeight: "200",
    marginVertical: Spacing.md,
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  settingControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingValue: {
    width: 60,
    textAlign: "center",
  },
  sectionLabel: {
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  backgroundRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  backgroundOption: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedOverlay: {
    alignItems: "center",
    gap: 2,
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
});
