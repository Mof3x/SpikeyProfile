import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import type {
  DayNote,
  InsightSettings,
  LowSensorySettings,
} from "@/core/DataContext";
import { dayKey } from "./dates";
import type { AnalyticsResult } from "./index";

const IDS_KEY = "@spikeyprofile/insightNotificationIds";
export const CHECKIN_CATEGORY = "spikey-checkin";
const CHECKIN_ACTIONS: Record<string, number> = { rough: 2, ok: 3, good: 4 };
const MED_NUDGE_DAYS = 2;

interface Planned {
  date: Date;
  title: string;
  body: string;
  category?: string;
}

function at(base: Date, dayOffset: number, minutes: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  const m = Math.min(Math.max(Math.round(minutes), 0), 23 * 60 + 30);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
}

export function planNotifications(
  result: AnalyticsResult,
  settings: InsightSettings,
  now: Date,
): Planned[] {
  const planned: Planned[] = [];

  if (settings.medNudges) {
    for (const med of result.meds) {
      if (!med.daily || med.windowEnd === undefined) continue;
      for (let d = 0; d < MED_NUDGE_DAYS; d++) {
        if (d === 0 && med.loggedToday) continue;
        const when = at(now, d, med.windowEnd);
        if (when <= now) continue;
        planned.push({
          date: when,
          title: med.name,
          body: `No log for ${med.name} yet today. If you've taken it, a quick log keeps your history accurate.`,
        });
      }
    }
  }

  if (settings.outlookNotifications) {
    if (result.toughTomorrow?.warn) {
      const when = at(now, 0, 20 * 60);
      if (when > now) {
        planned.push({
          date: when,
          title: "Tomorrow's outlook",
          body: "Tomorrow might be a heavier day. Want to keep plans light?",
        });
      }
    } else if (result.toughToday?.warn) {
      const when = at(now, 0, 8 * 60 + 30);
      if (when > now) {
        planned.push({
          date: when,
          title: "Today's outlook",
          body: "Today might be a heavier day. Go gently.",
        });
      }
    }
  }

  if (settings.lowEffortCheckins && result.engagement.quietRisk?.warn) {
    const routine = result.engagement.routines.find((r) => r.id === "checkin");
    const minutes = routine?.usualMinutes ?? 20 * 60;
    for (let d = 0; d < 2; d++) {
      const when = at(now, d, minutes);
      if (when <= now) continue;
      planned.push({
        date: when,
        title: "Quick check-in",
        body: "How's today? One tap is enough.",
        category: CHECKIN_CATEGORY,
      });
      break;
    }
  }
  return planned;
}

/**
 * Keeps the insight notifications (med nudges, outlook, low-effort check-ins) in step with the latest
 * analysis. Everything is off unless switched on in Settings.
 */
export function useInsightNotifications(
  result: AnalyticsResult,
  settings: InsightSettings,
  lowSensory: LowSensorySettings,
  saveDayNotes: (
    dates: string[],
    note: Omit<DayNote, "date" | "createdAt">,
  ) => void,
) {
  const saveRef = useRef(saveDayNotes);
  saveRef.current = saveDayNotes;
  const anyOn =
    settings.medNudges ||
    settings.outlookNotifications ||
    settings.lowEffortCheckins;

  useEffect(() => {
    if (Platform.OS === "web") return;
    Notifications.setNotificationCategoryAsync(CHECKIN_CATEGORY, [
      {
        identifier: "rough",
        buttonTitle: "Rough",
        options: { opensAppToForeground: false },
      },
      {
        identifier: "ok",
        buttonTitle: "OK",
        options: { opensAppToForeground: false },
      },
      {
        identifier: "good",
        buttonTitle: "Good",
        options: { opensAppToForeground: false },
      },
    ]).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const overall = CHECKIN_ACTIONS[response.actionIdentifier];
        if (overall !== undefined)
          saveRef.current([dayKey(new Date())], { overall, reasons: [] });
      },
    );
    return () => sub.remove();
  }, []);

  const signature = JSON.stringify(
    planNotifications(result, settings, new Date()).map((p) => [
      p.date.getTime(),
      p.title,
      p.category ?? "",
    ]),
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      try {
        const previous: string[] = JSON.parse(
          (await AsyncStorage.getItem(IDS_KEY)) ?? "[]",
        );
        await Promise.all(
          previous.map((id) =>
            Notifications.cancelScheduledNotificationAsync(id).catch(
              () => undefined,
            ),
          ),
        );
        if (!anyOn) {
          await AsyncStorage.setItem(IDS_KEY, "[]");
          return;
        }
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted")
          status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted" || cancelled) return;
        const ids: string[] = [];
        for (const p of planNotifications(result, settings, new Date())) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: p.title,
              body: p.body,
              sound: !lowSensory.muteNotificationSounds,
              categoryIdentifier: p.category,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: p.date,
            },
          });
          ids.push(id);
        }
        await AsyncStorage.setItem(IDS_KEY, JSON.stringify(ids));
      } catch {
        // Notifications are a convenience; failures never block the app.
      }
    })();
    return () => {
      cancelled = true;
    };
    // The signature captures everything that changes what gets scheduled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, anyOn, lowSensory.muteNotificationSounds]);
}
