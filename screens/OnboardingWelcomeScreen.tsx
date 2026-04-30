import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { useOnboardingFlow } from "@/core/OnboardingFlowContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { Spacing } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "OnboardingWelcome"
>;

export default function OnboardingWelcomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { setOnboardingComplete } = useData();
  const { resetOnboardingState } = useOnboardingFlow();

  const handleStart = () => {
    Haptics.selectionAsync();
    navigation.navigate("OnboardingPreferences");
  };

  const handleSkip = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetOnboardingState();
    setOnboardingComplete(true);
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <Spacer height={Spacing["3xl"]} />
      <ThemedText type="h1" style={{ textAlign: "center" }}>
        Welcome to SpikeyProfile
      </ThemedText>
      <Spacer height={Spacing.md} />
      <ThemedText
        type="body"
        style={{ color: theme.textSecondary, lineHeight: 24 }}
      >
        This short setup personalizes modules, theme, and your support profile.
        It stays editable in settings, and you can always 'skip for now'.
      </ThemedText>

      <Spacer height={Spacing["2xl"]} />

      <Card style={styles.card}>
        <ThemedText type="h4">What this setup does</ThemedText>
        <View style={styles.bulletList}>
          <ThemedText type="body">
            - Builds an editable 8-area strengths/challenges profile
          </ThemedText>
          <ThemedText type="body">
            - Recommends a starter module bundle
          </ThemedText>
          <ThemedText type="body">- Keeps final choice with you</ThemedText>
        </View>
      </Card>

      <Spacer height={Spacing["2xl"]} />

      <Button onPress={handleStart}>Start setup</Button>
      <Spacer height={Spacing.md} />
      <Button
        onPress={handleSkip}
        style={{ backgroundColor: theme.surfaceVariant }}
      >
        Skip for now
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
  bulletList: {
    gap: Spacing.sm,
  },
});
