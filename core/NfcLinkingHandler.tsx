import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as ExpoLinking from "expo-linking";

import { useData } from "@/core/DataContext";
import { parseQuickLogDeepLink } from "@/core/nfcLinks";

export function NfcLinkingHandler() {
  const { quickLogActions, logQuickAction } = useData();
  const lastHandledRef = useRef<{ url: string | null; timestamp: number }>({
    url: null,
    timestamp: 0,
  });

  useEffect(() => {
    const processUrl = (url: string | null) => {
      if (!url) {
        return;
      }
      const now = Date.now();
      const isDuplicateImmediateEvent =
        lastHandledRef.current.url === url &&
        now - lastHandledRef.current.timestamp < 1200;

      if (isDuplicateImmediateEvent) {
        return;
      }

      const parsed = parseQuickLogDeepLink(url);
      if (!parsed) {
        return;
      }

      lastHandledRef.current = { url, timestamp: now };
      const action = quickLogActions.find(
        (candidate) => candidate.id === parsed.actionId && candidate.enabled,
      );

      if (!action) {
        Alert.alert(
          "NFC action unavailable",
          "This tag points to a quick action that is disabled or no longer exists.",
        );
        return;
      }

      logQuickAction(action.id);
      Alert.alert("NFC quick log", `Logged: ${action.name}`);
    };

    ExpoLinking.getInitialURL().then((initialUrl) => {
      processUrl(initialUrl);
    });

    const subscription = ExpoLinking.addEventListener("url", ({ url }) => {
      processUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [logQuickAction, quickLogActions]);

  return null;
}
