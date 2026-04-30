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
  ONBOARDING_CHALLENGE_QUESTIONS,
} from "@/core/OnboardingFlowContext";
import { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { Spacing } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "OnboardingChallenges"
>;

export default function OnboardingChallengesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { axisScores, setAxisScore } = useOnboardingFlow();

  const handleNext = () => {
    Haptics.selectionAsync();
    navigation.navigate("OnboardingSummary");
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <OnboardingProgress
        step={4}
        total={6}
        title="Challenge profile"
        subtitle="Rate how much support effort each area usually needs."
      />
      <Spacer height={Spacing.xl} />

      {ONBOARDING_CHALLENGE_QUESTIONS.map((question) => (
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
