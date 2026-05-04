import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  Switch,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { NFCHowToGuide } from "@/components/NFCHowToGuide";
import { OnboardingAxisProfileChart } from "@/components/OnboardingAxisProfileChart";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext, ThemeId, FontSize } from "@/core/ThemeContext";
import { useModules, ModuleConfig } from "@/core/ModuleContext";
import { useData, LowSensorySettings } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

function SettingsSection({
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
          <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
            {children}
          </View>
        </>
      ) : null}
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
  const { theme } = useTheme();
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
                backgroundColor: isSelected
                  ? theme.primary
                  : theme.surfaceVariant,
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

function LowSensoryModeSettings() {
  const { theme } = useTheme();
  const { lowSensorySettings, setLowSensorySettings } = useData();

  const toggleSetting = (key: keyof LowSensorySettings) => {
    Haptics.selectionAsync();
    const updated = { ...lowSensorySettings };

    if (key === "enabled") {
      const newEnabled = !lowSensorySettings.enabled;
      updated.enabled = newEnabled;

      if (newEnabled) {
        const hasExistingPreferences =
          lowSensorySettings.reduceAnimations ||
          lowSensorySettings.reduceContrast ||
          lowSensorySettings.quietHaptics ||
          lowSensorySettings.simplifyUI ||
          lowSensorySettings.muteNotificationSounds;

        if (!hasExistingPreferences) {
          updated.reduceAnimations = true;
          updated.reduceContrast = true;
          updated.quietHaptics = true;
          updated.simplifyUI = true;
          updated.muteNotificationSounds = true;
        }
      }
    } else {
      updated[key] = !lowSensorySettings[key];
      const anyEnabled =
        updated.reduceAnimations ||
        updated.reduceContrast ||
        updated.quietHaptics ||
        updated.simplifyUI ||
        updated.muteNotificationSounds;
      updated.enabled = anyEnabled;
    }

    setLowSensorySettings(updated);
  };

  const settings = [
    {
      key: "reduceAnimations" as const,
      icon: "zap-off",
      label: "Reduce Animations",
      description: "Minimize motion effects",
    },
    {
      key: "reduceContrast" as const,
      icon: "sun",
      label: "Softer Colors",
      description: "Lower color intensity",
    },
    {
      key: "quietHaptics" as const,
      icon: "smartphone",
      label: "Quiet Haptics",
      description: "Gentler vibrations",
    },
    {
      key: "simplifyUI" as const,
      icon: "layout",
      label: "Simplified UI",
      description: "Less visual complexity",
    },
    {
      key: "muteNotificationSounds" as const,
      icon: "bell-off",
      label: "Silent Notifications",
      description: "Visual alerts only",
    },
  ];

  const getStatusText = () => {
    if (!lowSensorySettings.enabled) {
      return "Off - Customize below";
    }
    const enabledCount = [
      lowSensorySettings.reduceAnimations,
      lowSensorySettings.reduceContrast,
      lowSensorySettings.quietHaptics,
      lowSensorySettings.simplifyUI,
      lowSensorySettings.muteNotificationSounds,
    ].filter(Boolean).length;

    if (enabledCount === 5) {
      return "On - All options enabled";
    }
    return `On - ${enabledCount} of 5 options active`;
  };

  return (
    <View style={styles.lowSensoryContainer}>
      <View style={styles.masterToggleRow}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.primary + "20" },
          ]}
        >
          <Feather name="volume-x" size={18} color={theme.primary} />
        </View>
        <View style={styles.rowContent}>
          <ThemedText type="body" style={styles.rowLabel}>
            Low Sensory Mode
          </ThemedText>
          <ThemedText
            type="small"
            style={[styles.rowDescription, { color: theme.textSecondary }]}
          >
            {getStatusText()}
          </ThemedText>
        </View>
        <Switch
          value={lowSensorySettings.enabled}
          onValueChange={() => toggleSetting("enabled")}
          trackColor={{ false: "#3A4150", true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View
        style={[styles.sensoryDivider, { backgroundColor: theme.divider }]}
      />

      <ThemedText
        type="caption"
        style={{ color: theme.textSecondary, marginBottom: Spacing.md }}
      >
        Customize individual settings:
      </ThemedText>

      {settings.map((setting, index) => (
        <View key={setting.key} style={styles.sensoryOptionRow}>
          <View
            style={[
              styles.sensoryIcon,
              { backgroundColor: theme.surfaceVariant },
            ]}
          >
            <Feather
              name={setting.icon as any}
              size={16}
              color={theme.textSecondary}
            />
          </View>
          <View style={styles.sensoryOptionContent}>
            <ThemedText type="body">{setting.label}</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {setting.description}
            </ThemedText>
          </View>
          <Switch
            value={lowSensorySettings[setting.key]}
            onValueChange={() => toggleSetting(setting.key)}
            trackColor={{ false: "#3A4150", true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      ))}
    </View>
  );
}

function DeviceStorageSettings() {
  const { theme } = useTheme();
  const { deviceStorageEnabled, setDeviceStorageEnabled, clearAllDeviceData } =
    useData();

  const handleToggleStorage = (nextValue: boolean) => {
    if (!nextValue) {
      Alert.alert(
        "Turn off on-device storage?",
        "Turning this off will clear saved data from this device and future changes will not be saved.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Turn off",
            style: "destructive",
            onPress: () => setDeviceStorageEnabled(false),
          },
        ],
      );
      return;
    }
    setDeviceStorageEnabled(true);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear on-device data?",
      "This removes saved logs, settings, and onboarding data from this device. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearAllDeviceData(),
        },
      ],
    );
  };

  return (
    <SettingsSection title="Data & storage">
      <SettingsRow
        icon="database"
        label="On-device storage"
        description="Save your data locally on this device"
        rightElement={
          <Switch
            value={deviceStorageEnabled}
            onValueChange={handleToggleStorage}
            trackColor={{ false: "#3A4150", true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        }
      />
      <SettingsRow
        icon="trash-2"
        label="Clear on-device data"
        description="Remove all saved data from this device"
        onPress={() => {
          Haptics.selectionAsync();
          handleClearData();
        }}
        isLast
      />
    </SettingsSection>
  );
}

export default function SettingsScreen() {
  const { theme, typography } = useTheme();
  const navigation = useNavigation<any>();
  const { isDark, setIsDark } = useThemeContext();
  const { modules, resetToDefaults } = useModules();
  const {
    userName,
    setUserName,
    profileImageUri,
    setProfileImageUri,
    userStats,
    onboardingProfile,
    setOnboardingComplete,
    clearOnboardingProfile,
  } = useData();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [showNFCGuide, setShowNFCGuide] = useState(false);

  const handleSaveName = () => {
    setUserName(nameInput);
    setEditingName(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickProfilePhoto = async () => {
    Haptics.selectionAsync();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo library access to set your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setProfileImageUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemoveProfilePhoto = () => {
    if (!profileImageUri) return;
    Alert.alert(
      "Remove profile photo?",
      "This will restore the default avatar.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setProfileImageUri(null),
        },
      ],
    );
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
      ],
    );
  };

  const handleExport = () => {
    Alert.alert(
      "Export Data",
      "Your data will be exported as a CSV file. In the full version, this would generate a downloadable file.",
      [{ text: "OK" }],
    );
  };

  const handleRunOnboardingAgain = () => {
    Alert.alert(
      "Run onboarding again",
      "This will reopen onboarding to refresh your profile and module setup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Run",
          onPress: () => {
            Haptics.selectionAsync();
            setOnboardingComplete(false);
          },
        },
      ],
    );
  };

  const handleClearOnboardingProfile = () => {
    Alert.alert(
      "Clear onboarding profile",
      "This removes saved onboarding answers and will show onboarding on next app load.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearOnboardingProfile();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ],
    );
  };

  return (
    <ScreenScrollView>
      <Spacer height={Spacing.md} />

      <SettingsSection title="PROFILE">
        <SettingsRow
          icon="user"
          label="Profile"
          description="Always-accessible profile, graphs, and results"
          onPress={() => navigation.navigate("Profile")}
        />
        <View style={styles.profileSection}>
          <Pressable
            onPress={handlePickProfilePhoto}
            style={({ pressed }) => [
              styles.avatar,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={32} color="#FFFFFF" />
            )}
            <View style={[styles.avatarBadge, { backgroundColor: theme.surface }]}>
              <Feather name="camera" size={14} color={theme.primary} />
            </View>
          </Pressable>
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
                style={[
                  styles.saveNameButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setEditingName(true)}
              style={styles.nameContainer}
            >
              <ThemedText type="h4">{userName || "Tap to set name"}</ThemedText>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
          <Spacer height={Spacing.sm} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Level {userStats.level} | {userStats.xp} XP
          </ThemedText>
          <Spacer height={Spacing.xs} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Tap avatar to change photo
          </ThemedText>
          {profileImageUri ? (
            <Pressable
              onPress={handleRemoveProfilePhoto}
              style={({ pressed }) => [styles.removePhotoButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="trash-2" size={14} color={theme.error} />
              <ThemedText type="caption" style={{ color: theme.error }}>
                Remove photo
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </SettingsSection>

      {onboardingProfile ? (
        <SettingsSection title="ONBOARDING RESULTS">
          <OnboardingAxisProfileChart scores={onboardingProfile.axisScores} />
        </SettingsSection>
      ) : null}

      <SettingsSection title="APPEARANCE">
        <View style={styles.appearanceContent}>
          <ThemedText
            type="small"
            style={[styles.appearanceLabel, { color: theme.textSecondary }]}
          >
            Theme
          </ThemedText>
          <ThemePicker />

          <View
            style={[
              styles.appearanceDivider,
              { backgroundColor: theme.divider },
            ]}
          />

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

          <View
            style={[
              styles.appearanceDivider,
              { backgroundColor: theme.divider },
            ]}
          />

          <ThemedText
            type="small"
            style={[styles.appearanceLabel, { color: theme.textSecondary }]}
          >
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
              <View
                style={[styles.divider, { backgroundColor: theme.divider }]}
              />
            ) : null}
          </View>
        ))}
      </SettingsSection>

      <DeviceStorageSettings />

      <SettingsSection title="DATA">
        <SettingsRow
          icon="download"
          label="Export Data"
          description="Download your data as CSV"
          onPress={handleExport}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
        />
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <SettingsRow
          icon="refresh-cw"
          label="Reset to MVP"
          description="Restore default module settings"
          onPress={handleReset}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
          isLast
        />
      </SettingsSection>

      <SettingsSection title="ONBOARDING">
        <SettingsRow
          icon="refresh-cw"
          label="Run onboarding again"
          description="Retake setup and refresh your module recommendations"
          onPress={handleRunOnboardingAgain}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
        />
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        <SettingsRow
          icon="trash-2"
          label="Clear onboarding profile"
          description={
            onboardingProfile
              ? "Delete saved onboarding profile and answers"
              : "No saved onboarding profile found"
          }
          onPress={handleClearOnboardingProfile}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
          isLast
        />
      </SettingsSection>

      <SettingsSection title="ACCESSIBILITY">
        <LowSensoryModeSettings />
      </SettingsSection>

      <SettingsSection title="HELP">
        <SettingsRow
          icon="smartphone"
          label="NFC Quick Log Guide"
          description="Learn how to use NFC tags for instant logging"
          onPress={() => setShowNFCGuide(true)}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
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

      <NFCHowToGuide
        visible={showNFCGuide}
        onClose={() => setShowNFCGuide(false)}
      />
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
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  removePhotoButton: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
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
  lowSensoryContainer: {
    padding: Spacing.lg,
  },
  masterToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sensoryDivider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  sensoryOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sensoryIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sensoryOptionContent: {
    flex: 1,
  },
});
