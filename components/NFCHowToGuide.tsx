import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface NFCHowToGuideProps {
  visible: boolean;
  onClose: () => void;
}

export function NFCHowToGuide({ visible, onClose }: NFCHowToGuideProps) {
  const { theme } = useTheme();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  const phoneY = useSharedValue(0);
  const tagGlow = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const phoneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: phoneY.value }],
  }));

  const tagGlowStyle = useAnimatedStyle(() => ({
    opacity: tagGlow.value,
  }));

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationComplete(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    phoneY.value = withSequence(
      withTiming(-10, { duration: 500 }),
      withRepeat(
        withSequence(
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        2,
        true,
      ),
      withTiming(0, { duration: 300 }),
    );

    pulseScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        3,
        true,
      ),
    );

    pulseOpacity.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 600 }),
          withTiming(0.2, { duration: 600 }),
        ),
        3,
        true,
      ),
    );

    setTimeout(() => {
      setSimulationStep(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1500);

    setTimeout(() => {
      setSimulationStep(2);
      tagGlow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.5, { duration: 300 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);

    setTimeout(() => {
      setSimulationStep(3);
      setSimulationComplete(true);
      setIsSimulating(false);
    }, 4000);
  };

  const resetSimulation = () => {
    setSimulationStep(0);
    setSimulationComplete(false);
    pulseScale.value = 1;
    pulseOpacity.value = 0.3;
    phoneY.value = 0;
    tagGlow.value = 0;
  };

  useEffect(() => {
    if (!visible) {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      cancelAnimation(phoneY);
      cancelAnimation(tagGlow);
      resetSimulation();
    }
  }, [visible]);

  const steps = [
    {
      icon: "edit-3",
      title: "Set Up Your Actions",
      description:
        "Go to the Quick Log card on your home screen and create the actions you want to track, like taking medication or logging a symptom.",
    },
    {
      icon: "smartphone",
      title: "Get NFC Tags",
      description:
        "Purchase blank NFC tags (available online). Place them where you'll see them - on your medicine cabinet, by your bed, or on your water bottle.",
    },
    {
      icon: "download",
      title: "Write to Tags",
      description:
        "In SpikeyProfile, open Quick Log > NFC Setup and copy/share the generated action URL. Use any NFC writer app to write that URL to a tag.",
    },
    {
      icon: "zap",
      title: "Tap to Log",
      description:
        "When you tap your phone to a programmed tag, SpikeyProfile opens from the deep link and logs the mapped quick action instantly.",
    },
  ];

  const simulationSteps = [
    "Move phone toward tag...",
    "Detecting NFC signal...",
    "Reading tag data...",
    "Action logged!",
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView
          style={[styles.content, { backgroundColor: theme.surface }]}
        >
          <View style={styles.header}>
            <ThemedText type="h3">How NFC Quick Log Works</ThemedText>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.simulatorSection}>
            <ThemedText
              type="small"
              style={[styles.sectionLabel, { color: theme.textSecondary }]}
            >
              Try the Simulation
            </ThemedText>

            <View
              style={[
                styles.simulator,
                { backgroundColor: theme.surfaceVariant },
              ]}
            >
              <View style={styles.simulatorVisual}>
                <View style={[styles.nfcTag, { borderColor: theme.divider }]}>
                  <Animated.View
                    style={[
                      styles.tagGlowRing,
                      { backgroundColor: theme.success },
                      tagGlowStyle,
                    ]}
                  />
                  <Feather
                    name="wifi"
                    size={20}
                    color={theme.textSecondary}
                    style={{ transform: [{ rotate: "45deg" }] }}
                  />
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    NFC Tag
                  </ThemedText>
                </View>

                <View style={styles.phoneContainer}>
                  <Animated.View style={phoneStyle}>
                    <View
                      style={[
                        styles.phone,
                        {
                          borderColor: theme.divider,
                          backgroundColor: theme.surface,
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.pulseRing,
                          { borderColor: theme.primary },
                          pulseStyle,
                        ]}
                      />
                      <Feather
                        name="smartphone"
                        size={28}
                        color={theme.primary}
                      />
                    </View>
                  </Animated.View>
                </View>
              </View>

              <View style={styles.simulatorStatus}>
                <ThemedText
                  type="body"
                  style={{
                    color: theme.text,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {simulationSteps[simulationStep]}
                </ThemedText>
                {simulationComplete && (
                  <View
                    style={[
                      styles.successBadge,
                      { backgroundColor: theme.success + "20" },
                    ]}
                  >
                    <Feather name="check" size={16} color={theme.success} />
                    <ThemedText type="caption" style={{ color: theme.success }}>
                      Medication taken at 2:30 PM
                    </ThemedText>
                  </View>
                )}
              </View>

              {!isSimulating && (
                <Pressable
                  onPress={
                    simulationComplete ? resetSimulation : startSimulation
                  }
                  style={[
                    styles.simulateButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Feather
                    name={simulationComplete ? "refresh-cw" : "play"}
                    size={18}
                    color="#FFFFFF"
                  />
                  <ThemedText
                    type="body"
                    style={{ color: "#FFFFFF", fontWeight: "600" }}
                  >
                    {simulationComplete ? "Try Again" : "Start Simulation"}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.stepsSection}>
            <ThemedText
              type="small"
              style={[styles.sectionLabel, { color: theme.textSecondary }]}
            >
              Setup Steps
            </ThemedText>

            {steps.map((step, index) => (
              <View key={index} style={styles.step}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: "#FFFFFF", fontWeight: "700" }}
                  >
                    {index + 1}
                  </ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <View style={styles.stepHeader}>
                    <Feather
                      name={step.icon as any}
                      size={16}
                      color={theme.primary}
                    />
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {step.title}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary, lineHeight: 18 }}
                  >
                    {step.description}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          <View
            style={[styles.tipBox, { backgroundColor: theme.accent + "15" }]}
          >
            <Feather name="info" size={18} color={theme.accent} />
            <View style={styles.tipContent}>
              <ThemedText
                type="body"
                style={{ fontWeight: "600", color: theme.accent }}
              >
                Pro Tip
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.text }}>
                Start with one or two tags for your highest-priority routines.
                Use the in-app NFC Setup sheet to generate one URL per action.
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  simulatorSection: {
    marginBottom: Spacing.xl,
  },
  simulator: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  simulatorVisual: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["3xl"],
    marginBottom: Spacing.xl,
  },
  nfcTag: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  tagGlowRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  phoneContainer: {
    height: 80,
    justifyContent: "center",
  },
  phone: {
    width: 48,
    height: 72,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  simulatorStatus: {
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: 60,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  stepsSection: {
    marginBottom: Spacing.xl,
  },
  step: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  tipContent: {
    flex: 1,
    gap: Spacing.xs,
  },
});
