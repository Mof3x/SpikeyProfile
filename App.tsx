import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ModuleProvider } from "@/core/ModuleContext";
import { DataProvider, useData } from "@/core/DataContext";
import { ThemeProvider, useThemeContext } from "@/core/ThemeContext";
import { OnboardingFlowProvider } from "@/core/OnboardingFlowContext";
import { LoggedFeedbackProvider } from "@/core/LoggedFeedbackContext";
import { NfcLinkingHandler } from "@/core/NfcLinkingHandler";

function AppContent() {
  const { isDark, theme, isLoading: isThemeLoading } = useThemeContext();
  const { isLoading: isDataLoading } = useData();

  if (isThemeLoading || isDataLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <NfcLinkingHandler />
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardProvider>
          <ThemeProvider>
            <ModuleProvider>
              <DataProvider>
                <OnboardingFlowProvider>
                  <LoggedFeedbackProvider>
                    <ErrorBoundary>
                      <AppContent />
                    </ErrorBoundary>
                  </LoggedFeedbackProvider>
                </OnboardingFlowProvider>
              </DataProvider>
            </ModuleProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
