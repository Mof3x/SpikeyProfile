import React, { useState } from "react";
import { StyleSheet, View, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function NFCQuickTap() {
  const { theme } = useTheme();
  const { addSymptomEntry } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [tapped, setTapped] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    setTapped(true);

    addSymptomEntry({
      mood: 5,
      energy: 5,
      brainFog: 5,
      sensoryOverload: 5,
      executiveDysfunction: 5,
    });

    setTimeout(() => {
      setTapped(false);
    }, 2000);
  };

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surfaceVariant }]}>
          <Feather name="radio" size={18} color={theme.primary} />
        </View>
        <View style={styles.headerText}>
          <ThemedText type="h4">Quick Tap</ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            Simulated NFC logging
          </ThemedText>
        </View>
        <Pressable
          onPress={handleOpenModal}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="info" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handleTap}
          style={({ pressed }) => [
            styles.tapButton,
            {
              backgroundColor: tapped ? theme.success : theme.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Feather
            name={tapped ? "check" : "smartphone"}
            size={32}
            color="#FFFFFF"
          />
          <ThemedText type="body" style={styles.tapText}>
            {tapped ? "Logged!" : "Tap to Log"}
          </ThemedText>
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Feather name="radio" size={32} color={theme.primary} />
              <ThemedText type="h3" style={styles.modalTitle}>
                NFC Quick Tap
              </ThemedText>
            </View>
            <ThemedText
              type="body"
              style={[styles.modalDescription, { color: theme.textSecondary }]}
            >
              This simulates NFC tag functionality. In the full version, you can
              attach NFC tags to convenient locations (like above your medicine
              cabinet) and tap your phone to quickly log activities.
            </ThemedText>
            <View style={styles.features}>
              <View style={styles.feature}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  One-tap medication logging
                </ThemedText>
              </View>
              <View style={styles.feature}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Exercise completion tracking
                </ThemedText>
              </View>
              <View style={styles.feature}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Custom routine reminders
                </ThemedText>
              </View>
            </View>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                Got it
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>
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
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  tapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  tapText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modalHeader: {
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    textAlign: "center",
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  features: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  closeButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
