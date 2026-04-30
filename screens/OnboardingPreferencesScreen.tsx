import React from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext, ThemeId } from "@/core/ThemeContext";
import { useOnboardingFlow } from "@/core/OnboardingFlowContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { BorderRadius, Spacing } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "OnboardingPreferences"
>;

const MODE_OPTIONS: {
  id: "light" | "dark" | "sameAsCurrent";
  label: string;
}[] = [
  { id: "sameAsCurrent", label: "Keep current" },
  { id: "light", label: "Light mode" },
  { id: "dark", label: "Dark mode" },
];

export default function OnboardingPreferencesScreen() {
  const { theme } = useTheme();
  const { themePresets } = useThemeContext();
  const navigation = useNavigation<NavigationProp>();
  const {
    displayName,
    setDisplayName,
    themeModePreference,
    setThemeModePreference,
    preferredThemeId,
    setPreferredThemeId,
  } = useOnboardingFlow();

  const handleNext = () => {
    Haptics.selectionAsync();
    navigation.navigate("OnboardingStrengths");
  };

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.content}>
      <OnboardingProgress
        step={2}
        total={6}
        title="Set your preferences"
        subtitle="Choose visual defaults. You can edit these later."
      />
      <Spacer height={Spacing.xl} />

      <Card style={styles.card}>
        <ThemedText type="h4">Display name (optional)</ThemedText>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should we greet you?"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: theme.surfaceVariant,
              color: theme.text,
            },
          ]}
        />
      </Card>

      <Spacer height={Spacing.lg} />

      <Card style={styles.card}>
        <ThemedText type="h4">Theme mode</ThemedText>
        <View style={styles.modeRow}>
          {MODE_OPTIONS.map((option) => {
            const selected = themeModePreference === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setThemeModePreference(option.id)}
                style={[
                  styles.modeChip,
                  {
                    backgroundColor: selected
                      ? theme.primary
                      : theme.surfaceVariant,
                    borderColor: selected ? theme.primary : theme.divider,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: selected ? "#FFFFFF" : theme.text }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Spacer height={Spacing.lg} />

      <Card style={styles.card}>
        <ThemedText type="h4">Theme preset</ThemedText>
        <View style={styles.themeGrid}>
          {themePresets.map((preset) => {
            const selected = preferredThemeId === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => setPreferredThemeId(preset.id as ThemeId)}
                style={[
                  styles.themeOption,
                  {
                    borderColor: selected ? theme.primary : theme.divider,
                    backgroundColor: selected
                      ? theme.primary + "22"
                      : theme.surfaceVariant,
                  },
                ]}
              >
                <View
                  style={[
                    styles.preview,
                    { backgroundColor: preset.dark.backgroundRoot },
                  ]}
                >
                  <View
                    style={[
                      styles.previewSwatch,
                      { backgroundColor: preset.dark.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewSwatch,
                      { backgroundColor: preset.dark.secondary },
                    ]}
                  />
                </View>
                <ThemedText type="caption">{preset.name}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Spacer height={Spacing.xl} />
      <Button onPress={handleNext}>Continue</Button>
      <Spacer height={Spacing["4xl"]} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  card: {
    gap: Spacing.md,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  modeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modeChip: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  themeOption: {
    width: "48%",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  preview: {
    flexDirection: "row",
    gap: Spacing.xs,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },
  previewSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
});
