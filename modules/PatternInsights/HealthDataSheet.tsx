import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { SaveButton, SheetModal, sheetStyles } from "@/components/SheetModal";
import { useTheme } from "@/hooks/useTheme";
import { useSources } from "@/core/sources/SourcesContext";
import {
  HEALTH_TYPES,
  type HealthDataType,
} from "@/core/sources/healthMetrics";
import { BorderRadius, Spacing } from "@/constants/theme";

const DEFAULT_TYPES: HealthDataType[] = [
  "steps",
  "exercise",
  "sleep",
  "heart",
  "hrv",
  "cycle",
];

/** Pick which body data to read from Apple Health / Health Connect. Read-only; nothing is written back. */
export function HealthDataSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { health, connectHealth, healthLabel, openHealthSettings } =
    useSources();
  const [types, setTypes] = useState<HealthDataType[]>(
    health.types.length ? health.types : DEFAULT_TYPES,
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setTypes(health.types.length ? health.types : DEFAULT_TYPES);
  }, [visible, health.types]);

  const groups = [...new Set(HEALTH_TYPES.map((t) => t.group))];

  const connect = async () => {
    setBusy(true);
    const ok = await connectHealth(types);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <SheetModal
      visible={visible}
      title={`Connect ${healthLabel}`}
      onClose={onClose}
    >
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
      >
        Choose what the app may read. It’s only read, never changed, and stays
        on this phone.
      </ThemedText>
      {Platform.OS === "android" ? (
        <View style={[styles.note, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="info" size={16} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <ThemedText type="small">
              Using Samsung Health? Open Samsung Health → Settings → Health
              Connect and turn on sharing, so its data reaches Health Connect.
            </ThemedText>
            {openHealthSettings ? (
              <Pressable
                onPress={openHealthSettings}
                style={{ marginTop: Spacing.xs }}
              >
                <ThemedText
                  type="small"
                  style={{ color: theme.primary, fontWeight: "600" }}
                >
                  Open Health Connect
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      {groups.map((group) => (
        <View key={group}>
          <ThemedText type="small" style={sheetStyles.label}>
            {group}
          </ThemedText>
          {HEALTH_TYPES.filter((t) => t.group === group).map((t) => {
            const on = types.includes(t.id);
            return (
              <Pressable
                key={t.id}
                onPress={() =>
                  setTypes((prev) =>
                    on ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                  )
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={[styles.row, { borderBottomColor: theme.divider }]}
              >
                <Feather
                  name={on ? "check-square" : "square"}
                  size={20}
                  color={on ? theme.primary : theme.textSecondary}
                />
                <ThemedText type="body">{t.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      ))}
      <SaveButton
        label={busy ? "Connecting…" : "Connect"}
        onPress={connect}
        disabled={busy || types.length === 0}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  note: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
});
