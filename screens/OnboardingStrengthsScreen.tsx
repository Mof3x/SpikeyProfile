import React from "react";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import { OnboardingLikertQuestion } from "@/components/OnboardingLikertQuestion";
import { Button } from "@/components/Button";
import Spacer from "@/components/Spacer";
import {
  useOnboardingFlow,
  ONBOARDING_STRENGTH_QUESTIONS,
} from "@/core/OnboardingFlowContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { Spacing } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "OnboardingStrengths"
>;

export default function OnboardingStrengthsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { axisScores, setAxisScore } = useOnboardingFlow();

  const handleNext = () => {
    Haptics.selectionAsync();
    navigation.navigate("OnboardingChallenges");
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <OnboardingProgress
        step={3}
        total={6}
        title="Strengths profile"
        subtitle="Rate how strongly each area tends to show up for you."
      />
      <Spacer height={Spacing.xl} />

      {ONBOARDING_STRENGTH_QUESTIONS.map((question) => (
        <React.Fragment key={question.axisId}>
          <OnboardingLikertQuestion
            question={question}
            value={axisScores[question.axisId]}
            onChange={(score) => setAxisScore(question.axisId, score)}
          />
          <Spacer height={Spacing.md} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing.lg} />
      <Button onPress={handleNext}>Continue</Button>
      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
