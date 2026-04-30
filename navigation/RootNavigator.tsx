import React from "react";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingStackNavigator from "@/navigation/OnboardingStackNavigator";
import { useData } from "@/core/DataContext";

export default function RootNavigator() {
  const { onboardingComplete } = useData();

  if (onboardingComplete) {
    return <MainTabNavigator />;
  }

  return <OnboardingStackNavigator />;
}
