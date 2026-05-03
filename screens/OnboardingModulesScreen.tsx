import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useThemeContext } from "@/core/ThemeContext";
import { useData } from "@/core/DataContext";
import { useModules } from "@/core/ModuleContext";
import {
  ONBOARDING_BUNDLES,
  useOnboardingFlow,
} from "@/core/OnboardingFlowContext";
import { BorderRadius, Spacing } from "@/constants/theme";

export default function OnboardingModulesScreen() {
  const { theme } = useTheme();
  const { setThemeId, setIsDark } = useThemeContext();
  const { modules, setEnabledModules } = useModules();
  const { setUserName, saveOnboardingProfile } = useData();
  const {
    displayName,
    themeModePreference,
    preferredThemeId,
    axisScores,
    recommendedBundle,
    selectedBundle,
    selectedModules,
    toggleSelectedModule,
    setSelectedModules,
    resetOnboardingState,
  } = useOnboardingFlow();

  const selectedBundleConfig = ONBOARDING_BUNDLES.find(
    (bundle) => bundle.id === selectedBundle,
  );
  const recommendedBundleConfig = ONBOARDING_BUNDLES.find(
    (bundle) => bundle.id === recommendedBundle,
  );

  const selectedSet = useMemo(
    () => new Set(selectedModules),
    [selectedModules],
  );

  const handleApplyBundleDefaults = () => {
    if (!selectedBundleConfig) {
      return;
    }
    Haptics.selectionAsync();
    setSelectedModules(selectedBundleConfig.moduleIds);
  };

  const handleApplyRecommended = () => {
    if (!recommendedBundleConfig) {
      return;
    }
    Haptics.selectionAsync();
    setSelectedModules(recommendedBundleConfig.moduleIds);
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (themeModePreference === "light") {
      setIsDark(false);
    } else if (themeModePreference === "dark") {
      setIsDark(true);
    }

    setThemeId(preferredThemeId);

    const trimmedName = displayName.trim();
    if (trimmedName.length > 0) {
      setUserName(trimmedName);
    }

    setEnabledModules(selectedModules);
    saveOnboardingProfile({
      axisScores,
      displayName: trimmedName || undefined,
      themeModePreference,
      preferredThemeId,
      recommendedBundle,
      selectedBundle,
      selectedModules,
      completedAt: new Date(),
      skipped: false,
    });
    resetOnboardingState();
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <OnboardingProgress
        step={6}
        total={6}
        title="Module setup"
        subtitle="Pick your starter modules. You can change these at any time."
      />
      <Spacer height={Spacing.xl} />

      <Card style={styles.card}>
        <ThemedText type="h4">Starter set helpers</ThemedText>
        <Button
          onPress={handleApplyRecommended}
          style={{ backgroundColor: theme.surfaceVariant }}
        >
          Apply recommended bundle
        </Button>
      </Card>

      <Spacer height={Spacing.lg} />

      <Card style={styles.card}>
        <ThemedText type="h4">Choose modules</ThemedText>
        <View style={styles.moduleList}>
          {modules.map((module) => {
            const selected = selectedSet.has(module.id);
            return (
              <Pressable
                key={module.id}
                onPress={() => toggleSelectedModule(module.id)}
                style={[
                  styles.moduleRow,
                  {
                    backgroundColor: selected
                      ? theme.primary + "20"
                      : theme.surfaceVariant,
                    borderColor: selected ? theme.primary : theme.divider,
                  },
                ]}
              >
                <View style={styles.moduleText}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {module.name}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    {module.description}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: selected ? theme.primary : "transparent",
                      borderColor: selected ? theme.primary : theme.divider,
                    },
                  ]}
                >
                  {selected ? (
                    <ThemedText type="caption" style={{ color: "#FFFFFF" }}>
                      ✓
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Spacer height={Spacing.lg} />

      <Card style={styles.card}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {selectedModules.length} module
          {selectedModules.length === 1 ? "" : "s"} selected
        </ThemedText>
      </Card>

      <Spacer height={Spacing.xl} />
      <Button onPress={handleFinish} disabled={selectedModules.length === 0}>
        Apply and continue
      </Button>
      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  card: {
    gap: Spacing.md,
  },
  moduleList: {
    gap: Spacing.sm,
  },
  moduleRow: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  moduleText: {
    flex: 1,
    gap: Spacing.xs,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
