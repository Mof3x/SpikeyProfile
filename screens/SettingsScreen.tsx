import React, { useState } from "react";
import { StyleSheet, View, Pressable, Switch, TextInput, Alert, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext, ThemeId, FontSize } from "@/core/ThemeContext";
import { useModules, ModuleConfig } from "@/core/ModuleContext";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText
        type="small"
        style={[styles.sectionTitle, { color: theme.textSecondary }]}
      >
        {title}
      </ThemedText>
      <Spacer height={Spacing.sm} />
      <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
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
      <View style={[styles.iconContainer, { backgroundColor: theme.surfaceVariant }]}>
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

function ThemePicker() {
  const { theme } = useTheme();
  const { themeId, setThemeId, themePresets } = useThemeContext();

  const handleSelectTheme = (id: ThemeId) => {
    Haptics.selectionAsync();
    setThemeId(id);
  };

  return (
    <View style={styles.themePickerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themePickerScroll}
      >
        {themePresets.map((preset) => {
          const isSelected = themeId === preset.id;
          return (
            <Pressable
              key={preset.id}
              onPress={() => handleSelectTheme(preset.id)}
              style={({ pressed }) => [
                styles.themeOption,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View
                style={[
                  styles.themePreview,
                  {
                    backgroundColor: preset.dark.backgroundRoot,
                    borderColor: isSelected ? theme.primary : "transparent",
                    borderWidth: 3,
                  },
                ]}
              >
                <View
                  style={[
                    styles.themePreviewInner,
                    { backgroundColor: preset.dark.primary },
                  ]}
                />
                <View
                  style={[
                    styles.themePreviewAccent,
                    { backgroundColor: preset.dark.secondary },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                style={[
                  styles.themeName,
                  { color: isSelected ? theme.primary : theme.textSecondary },
                ]}
              >
                {preset.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function FontSizeSelector() {
  const { theme, typography } = useTheme();
  const { fontSize, setFontSize } = useThemeContext();

  const sizes: { id: FontSize; label: string }[] = [
    { id: "small", label: "S" },
    { id: "medium", label: "M" },
    { id: "large", label: "L" },
    { id: "extraLarge", label: "XL" },
  ];

  const handleSelectSize = (size: FontSize) => {
    Haptics.selectionAsync();
    setFontSize(size);
  };

  return (
    <View style={styles.fontSizeContainer}>
      {sizes.map((size) => {
        const isSelected = fontSize === size.id;
        return (
          <Pressable
            key={size.id}
            onPress={() => handleSelectSize(size.id)}
            style={[
              styles.fontSizeOption,
              {
                backgroundColor: isSelected ? theme.primary : theme.surfaceVariant,
              },
            ]}
          >
            <ThemedText
              type="body"
              style={[
                styles.fontSizeLabel,
                { color: isSelected ? "#FFFFFF" : theme.text },
              ]}
            >
              {size.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ModuleToggle({ module }: { module: ModuleConfig }) {
  const { theme } = useTheme();
  const { toggleModule } = useModules();

  const handleToggle = () => {
    Haptics.selectionAsync();
    toggleModule(module.id);
  };

  return (
    <SettingsRow
      icon={module.icon}
      label={module.name}
      description={module.description}
      rightElement={
        <Switch
          value={module.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: "#3A4150", true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      }
    />
  );
}

export default function SettingsScreen() {
  const { theme, typography } = useTheme();
  const { isDark, setIsDark, currentPreset } = useThemeContext();
  const { modules, resetToDefaults } = useModules();
  const { userName, setUserName, userStats } = useData();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const handleSaveName = () => {
    setUserName(nameInput);
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggleDarkMode = () => {
    Haptics.selectionAsync();
    setIsDark(!isDark);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Defaults",
      "This will reset all module settings to their default state. Your data will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetToDefaults();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleExport = () => {
    Alert.alert(
      "Export Data",
      "Your data will be exported as a CSV file. In the full version, this would generate a downloadable file.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScreenScrollView>
      <Spacer height={Spacing.md} />

      <SettingsSection title="PROFILE">
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Feather name="user" size={32} color="#FFFFFF" />
          </View>
          <Spacer height={Spacing.md} />
          {editingName ? (
            <View style={styles.nameInputContainer}>
              <TextInput
                style={[
                  styles.nameInput,
                  { 
                    backgroundColor: theme.surfaceVariant, 
                    color: theme.text,
                    fontSize: typography.body.fontSize,
                  },
                ]}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                autoFocus
                onSubmitEditing={handleSaveName}
              />
              <Pressable
                onPress={handleSaveName}
                style={[styles.saveNameButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setEditingName(true)}
              style={styles.nameContainer}
            >
              <ThemedText type="h4">
                {userName || "Tap to set name"}
              </ThemedText>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
          <Spacer height={Spacing.sm} />
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
          >
            Level {userStats.level} | {userStats.xp} XP
          </ThemedText>
        </View>
      </SettingsSection>

      <SettingsSection title="APPEARANCE">
        <View style={styles.appearanceContent}>
          <ThemedText type="small" style={[styles.appearanceLabel, { color: theme.textSecondary }]}>
            Theme
          </ThemedText>
          <ThemePicker />
          
          <View style={[styles.appearanceDivider, { backgroundColor: theme.divider }]} />
          
          <View style={styles.darkModeRow}>
            <View style={styles.darkModeLabel}>
              <Feather 
                name={isDark ? "moon" : "sun"} 
                size={18} 
                color={theme.primary} 
              />
              <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </ThemedText>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: "#3A4150", true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.appearanceDivider, { backgroundColor: theme.divider }]} />
          
          <ThemedText type="small" style={[styles.appearanceLabel, { color: theme.textSecondary }]}>
            Text Size
          </ThemedText>
          <FontSizeSelector />
        </View>
      </SettingsSection>

      <SettingsSection title="MODULES">
        {modules.map((module, index) => (
          <View key={module.id}>
            <ModuleToggle module={module} />
            {index < modules.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            ) : null}
          </View>
        ))}
      </SettingsSection>

      <SettingsSection title="DATA">
        <SettingsRow
          icon="download"
          label="Export Data"
          description="Download your data as CSV"
          onPress={handleExport}
          rightElement={
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          }
        />
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <SettingsRow
          icon="refresh-cw"
          label="Reset to MVP"
          description="Restore default module settings"
          onPress={handleReset}
          rightElement={
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          }
          isLast
        />
      </SettingsSection>

      <SettingsSection title="ABOUT">
        <SettingsRow
          icon="info"
          label="SpikeyProfile"
          description="Version 1.0.0 | GDPR Compliant"
          isLast
        />
      </SettingsSection>

      <Spacer height={Spacing["5xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: "600",
    letterSpacing: 0.5,
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
  divider: {
    height: 1,
    marginLeft: 68,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "80%",
  },
  nameInput: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    textAlign: "center",
  },
  saveNameButton: {
    width: Spacing.inputHeight,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  appearanceContent: {
    padding: Spacing.lg,
  },
  appearanceLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  appearanceDivider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  themePickerContainer: {
    marginTop: Spacing.xs,
  },
  themePickerScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  themeOption: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  themePreview: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  themePreviewInner: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  themePreviewAccent: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  themeName: {
    fontWeight: "500",
  },
  darkModeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  darkModeLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  fontSizeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  fontSizeOption: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeLabel: {
    fontWeight: "600",
  },
});
