import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export function SettingsSection({
  title,
  children,
  defaultCollapsed = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setCollapsed((prev) => !prev);
        }}
        style={({ pressed }) => [
          styles.sectionHeader,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          {title}
        </ThemedText>
        <Feather
          name={collapsed ? "chevron-right" : "chevron-down"}
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
      {!collapsed ? (
        <>
          <Spacer height={Spacing.sm} />
          <View
            style={[styles.sectionContent, { backgroundColor: theme.surface }]}
          >
            {children}
          </View>
        </>
      ) : null}
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  description,
  rightElement,
  onPress,
  isLast = false,
}: {
  icon: string;
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}) {
  const { theme } = useTheme();

  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.divider },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.surfaceVariant },
        ]}
      >
        <Feather name={icon as any} size={18} color={theme.primary} />
      </View>
      <View style={styles.rowContent}>
        <ThemedText type="body" style={styles.rowLabel}>
          {label}
        </ThemedText>
        {description ? (
          <ThemedText
            type="small"
            style={[styles.rowDescription, { color: theme.textSecondary }]}
          >
            {description}
          </ThemedText>
        ) : null}
      </View>
      {rightElement}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export function SettingsSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        Haptics.selectionAsync();
        onChange(v);
      }}
      trackColor={{ false: "#3A4150", true: theme.primary }}
      thumbColor="#FFFFFF"
    />
  );
}

export const settingsStyles = StyleSheet.create({
  divider: {
    height: 1,
    marginLeft: 68,
  },
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xs,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontWeight: "500",
  },
  rowDescription: {
    marginTop: 2,
    opacity: 0.7,
  },
});
