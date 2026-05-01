import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
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

  const questions = useMemo(() => ONBOARDING_CHALLENGE_QUESTIONS, []);
  const [index, setIndex] = useState(0);
  const question = questions[index];
  const isFirst = index === 0;
  const isLast = index === questions.length - 1;

  const handleBack = () => {
    Haptics.selectionAsync();
    if (!isFirst) {
      setIndex((prev) => Math.max(0, prev - 1));
      return;
    }
    navigation.navigate("OnboardingStrengths");
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (!isLast) {
      setIndex((prev) => Math.min(questions.length - 1, prev + 1));
      return;
    }
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

      {question ? (
        <>
          <OnboardingLikertQuestion
            question={question}
            value={axisScores[question.axisId]}
            onChange={(score) => setAxisScore(question.axisId, score)}
          />
          <Spacer height={Spacing.md} />

          <View style={styles.navRow}>
            <Button
              onPress={handleBack}
              style={styles.navButton}
            >
              Back
            </Button>
            <Button
              onPress={handleNext}
              style={styles.navButton}
            >
              {isLast ? "Continue" : "Next"}
            </Button>
          </View>
        </>
      ) : null}
      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  navRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  navButton: {
    flex: 1,
  },
});
