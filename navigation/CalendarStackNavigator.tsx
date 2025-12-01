import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalendarScreen from "@/screens/CalendarScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type CalendarStackParamList = {
  CalendarMain: undefined;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export default function CalendarStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{
          title: "Calendar",
        }}
      />
    </Stack.Navigator>
  );
}
