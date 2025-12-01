import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import InsightsScreen from "@/screens/InsightsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type InsightsStackParamList = {
  Insights: undefined;
};

const Stack = createNativeStackNavigator<InsightsStackParamList>();

export default function InsightsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          title: "My Patterns",
        }}
      />
    </Stack.Navigator>
  );
}
