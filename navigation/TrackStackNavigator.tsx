import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TrackScreen from "@/screens/TrackScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type TrackStackParamList = {
  Track: undefined;
};

const Stack = createNativeStackNavigator<TrackStackParamList>();

export default function TrackStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Track"
        component={TrackScreen}
        options={{
          title: "Track Symptoms",
        }}
      />
    </Stack.Navigator>
  );
}
