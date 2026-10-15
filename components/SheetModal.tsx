import React, { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { BorderRadius, Spacing } from "@/constants/theme";

export function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const { paddingBottom } = useScreenInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <ThemedView
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: Math.max(paddingBottom, Spacing.xl),
            },
          ]}
        >
          <View style={styles.header}>
            <ThemedText type="h4">{title}</ThemedText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

export function ChoiceChip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.surfaceVariant,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon as any}
          size={16}
          color={selected ? theme.buttonText : theme.textSecondary}
        />
      ) : null}
      <ThemedText
        type="small"
        style={{
          color: selected ? theme.buttonText : theme.text,
          fontWeight: "600",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function SaveButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.save,
        {
          backgroundColor: disabled ? theme.divider : theme.primary,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <ThemedText
        type="body"
        style={{
          color: disabled ? theme.textSecondary : theme.buttonText,
          fontWeight: "600",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 99,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (value: number) => string;
  label: string;
}) {
  const { theme } = useTheme();
  const button = (delta: number, icon: "minus" | "plus") => (
    <Pressable
      onPress={() =>
        onChange(
          Math.min(max, Math.max(min, Math.round((value + delta) * 100) / 100)),
        )
      }
      accessibilityRole="button"
      accessibilityLabel={`${icon === "plus" ? "Increase" : "Decrease"} ${label}`}
      style={[styles.stepButton, { backgroundColor: theme.surfaceVariant }]}
    >
      <Feather name={icon} size={20} color={theme.primary} />
    </Pressable>
  );
  return (
    <View
      style={styles.stepper}
      accessibilityLabel={`${label}: ${format(value)}`}
    >
      {button(-step, "minus")}
      <ThemedText type="h4" style={styles.stepValue}>
        {format(value)}
      </ThemedText>
      {button(step, "plus")}
    </View>
  );
}

export const sheetStyles = StyleSheet.create({
  label: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    borderRadius: BorderRadius.full,
  },
  save: {
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    minWidth: 72,
    textAlign: "center",
  },
});
