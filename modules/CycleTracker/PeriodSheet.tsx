import React from "react";
import { View } from "react-native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ChoiceChip, SheetModal, sheetStyles } from "@/components/SheetModal";
import { useData, type PeriodFlow } from "@/core/DataContext";
import { useAnalytics } from "@/core/AnalyticsContext";
import { dayKey, formatDayShort } from "@/core/analytics/dates";
import { useTheme } from "@/hooks/useTheme";

const FLOWS: { id: PeriodFlow; label: string }[] = [
  { id: "spotting", label: "Spotting" },
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
];

/** One tap to mark today as a period day; tap again to change or remove it. */
export function PeriodSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { periodDays, setPeriodDay, removePeriodDay } = useData();
  const { result, showNumbers } = useAnalytics();
  const today = dayKey(new Date());
  const current = periodDays.find((p) => p.date === today);
  const cycle = result.cycle;

  const choose = (flow: PeriodFlow) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPeriodDay(today, flow);
    onClose();
  };

  return (
    <SheetModal visible={visible} title="Period today?" onClose={onClose}>
      <ThemedText type="small" style={sheetStyles.label}>
        Flow
      </ThemedText>
      <View style={sheetStyles.chips}>
        {FLOWS.map((f) => (
          <ChoiceChip
            key={f.id}
            label={f.label}
            selected={current?.flow === f.id}
            onPress={() => choose(f.id)}
          />
        ))}
        {current ? (
          <ChoiceChip
            label="Not on my period"
            icon="x"
            selected={false}
            onPress={() => {
              Haptics.selectionAsync();
              removePeriodDay(today);
              onClose();
            }}
          />
        ) : null}
      </View>
      {cycle.hasData && cycle.predictedNextStart ? (
        <ThemedText
          type="small"
          style={{ color: theme.textSecondary, marginTop: 16 }}
        >
          {showNumbers
            ? `Next period predicted around ${formatDayShort(cycle.predictedNextStart)} (typical cycle ${cycle.medianLength} days).`
            : "The app estimates your next period from the days you log here."}
          {cycle.irregular
            ? " Your cycle varies, so predictions are rough."
            : ""}
        </ThemedText>
      ) : null}
      <ThemedText
        type="caption"
        style={{ color: theme.textSecondary, marginTop: 12 }}
      >
        Stays on your phone. Estimates aren’t suitable for contraception.
      </ThemedText>
    </SheetModal>
  );
}
