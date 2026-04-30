import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { OnboardingAxisProfileChart } from "@/components/OnboardingAxisProfileChart";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import {
  ONBOARDING_AXIS_LABELS,
  ONBOARDING_BUNDLES,
  useOnboardingFlow,
} from "@/core/OnboardingFlowContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "OnboardingSummary"
>;

export default function OnboardingSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const {
    axisScores,
    recommendedBundle,
    selectedBundle,
    setSelectedBundle,
    topChallengeAxis,
  } = useOnboardingFlow();

  const handleContinue = () => {
    Haptics.selectionAsync();
    navigation.navigate("OnboardingModules");
  };

  const recommended = ONBOARDING_BUNDLES.find(
    (bundle) => bundle.id === recommendedBundle,
  );
  const selected = ONBOARDING_BUNDLES.find(
    (bundle) => bundle.id === selectedBundle,
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <OnboardingProgress
        step={5}
        total={6}
        title="Your profile summary"
        subtitle="Review your 8-area profile and recommended module setup."
      />
      <Spacer height={Spacing.xl} />

      <OnboardingAxisProfileChart scores={axisScores} />
      <Spacer height={Spacing.lg} />

      <Card style={styles.card}>
        <ThemedText type="h4">Interpretation snapshot</ThemedText>
        <ThemedText
          type="body"
          style={{ color: theme.textSecondary, lineHeight: 22 }}
        >
          Your highest current support pressure is{" "}
          <ThemedText type="body" style={{ fontWeight: "700" }}>
            {ONBOARDING_AXIS_LABELS[topChallengeAxis]}
          </ThemedText>
          . We recommend starting with{" "}
          <ThemedText type="body" style={{ fontWeight: "700" }}>
            {recommended?.title ?? "Daily Control Deck"}
          </ThemedText>{" "}
          and then customizing from there.
        </ThemedText>
      </Card>

      <Spacer height={Spacing.lg} />

      <Card style={styles.card}>
        <ThemedText type="h4">Choose starter bundle</ThemedText>
        <View style={styles.bundleList}>
          {ONBOARDING_BUNDLES.map((bundle) => {
            const active = selected?.id === bundle.id;
            const recommendedMatch = bundle.id === recommendedBundle;
            return (
              <Button
                key={bundle.id}
                onPress={() => setSelectedBundle(bundle.id)}
                style={{
                  backgroundColor: active
                    ? theme.primary
                    : theme.surfaceVariant,
                }}
              >
                {bundle.title}
                {recommendedMatch ? " (Recommended)" : ""}
              </Button>
            );
          })}
        </View>
      </Card>

      <Spacer height={Spacing.xl} />
      <Button onPress={handleContinue}>Continue to modules</Button>
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
  bundleList: {
    gap: Spacing.sm,
  },
});
