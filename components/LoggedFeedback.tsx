import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  Easing,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

interface LoggedFeedbackProps {
  visible: boolean;
  actionName: string;
  icon?: string;
  duration?: number;
  onHide?: () => void;
}

export function LoggedFeedback({
  visible,
  actionName,
  icon = "check-circle",
  duration = 2500,
  onHide,
}: LoggedFeedbackProps) {
  const { theme } = useTheme();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      // Entrance animation
      translateY.value = withSpring(0, {
        damping: 12,
        mass: 1,
        overshootClamping: false,
      });
      opacity.value = withSpring(1, {
        damping: 12,
        mass: 1,
      });
      scale.value = withSpring(1, {
        damping: 12,
        mass: 1,
      });

      // Exit animation after duration
      const timer = setTimeout(() => {
        translateY.value = withTiming(100, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
        scale.value = withTiming(0.8, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });

        setTimeout(() => {
          onHide?.();
        }, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateY, opacity, scale, onHide]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.success,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name={icon as any} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="caption" style={styles.label}>
            Logged
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.actionName, { fontWeight: "600" }]}
            numberOfLines={1}
          >
            {actionName}
          </ThemedText>
        </View>
        <View style={styles.checkmark}>
          <Feather name="check" size={20} color="#FFFFFF" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.md,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  label: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  actionName: {
    color: "#FFFFFF",
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
