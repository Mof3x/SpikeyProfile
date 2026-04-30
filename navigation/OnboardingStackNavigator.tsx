import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingWelcomeScreen from "@/screens/OnboardingWelcomeScreen";
import OnboardingPreferencesScreen from "@/screens/OnboardingPreferencesScreen";
import OnboardingStrengthsScreen from "@/screens/OnboardingStrengthsScreen";
import OnboardingChallengesScreen from "@/screens/OnboardingChallengesScreen";
import OnboardingSummaryScreen from "@/screens/OnboardingSummaryScreen";
import OnboardingModulesScreen from "@/screens/OnboardingModulesScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingPreferences: undefined;
  OnboardingStrengths: undefined;
  OnboardingChallenges: undefined;
  OnboardingSummary: undefined;
  OnboardingModules: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="OnboardingWelcome"
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="OnboardingWelcome"
        component={OnboardingWelcomeScreen}
      />
      <Stack.Screen
        name="OnboardingPreferences"
        component={OnboardingPreferencesScreen}
      />
      <Stack.Screen
        name="OnboardingStrengths"
        component={OnboardingStrengthsScreen}
      />
      <Stack.Screen
        name="OnboardingChallenges"
        component={OnboardingChallengesScreen}
      />
      <Stack.Screen
        name="OnboardingSummary"
        component={OnboardingSummaryScreen}
      />
      <Stack.Screen
        name="OnboardingModules"
        component={OnboardingModulesScreen}
      />
    </Stack.Navigator>
  );
}
