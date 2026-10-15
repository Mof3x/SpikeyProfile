import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ChoiceChip, sheetStyles } from "@/components/SheetModal";
import {
  SettingsRow,
  SettingsSection,
  SettingsSwitch,
} from "@/components/SettingsParts";
import { useTheme } from "@/hooks/useTheme";
import { useData, type HomeTown } from "@/core/DataContext";
import { useModules } from "@/core/ModuleContext";
import { useSources } from "@/core/sources/SourcesContext";
import { confirmAction, notify } from "@/core/confirm";
import { pickFile, bytesToText } from "@/core/sources/importers/pickFile";
import { parseCsv, type CsvTable } from "@/core/sources/importers/csv";
import { parseSamsungZip } from "@/core/sources/importers/samsungHealth";
import { generateSyntheticData } from "@/core/analytics/demoData";
import { formatDayShort } from "@/core/analytics/dates";
import { TrackerManager } from "@/modules/CustomTrackers/TrackerManager";
import { IntakeConfigSheet } from "@/modules/Intake/IntakeConfigSheet";
import { HealthDataSheet } from "./HealthDataSheet";
import { CsvImportSheet } from "./CsvImportSheet";
import { BorderRadius, Spacing } from "@/constants/theme";

function since(iso: string | null | undefined): string {
  if (!iso) return "not yet";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} h ago`;
  return `${Math.round(minutes / 1440)} days ago`;
}

export function InsightSettingsSection() {
  const { theme, typography } = useTheme();
  const { insightSettings: s, updateInsightSettings, loadDemoData } = useData();
  const { isModuleEnabled, toggleModule } = useModules();
  const sources = useSources();
  const [townQuery, setTownQuery] = useState("");
  const [towns, setTowns] = useState<HomeTown[]>([]);
  const [sheet, setSheet] = useState<"trackers" | "intake" | "health" | null>(
    null,
  );
  const [csvFile, setCsvFile] = useState<{
    name: string;
    table: CsvTable;
  } | null>(null);
  const [importing, setImporting] = useState(false);

  const searchTown = async () => {
    try {
      setTowns(await sources.findTowns(townQuery));
    } catch {
      setTowns([]);
    }
  };

  const importSamsung = async () => {
    try {
      const file = await pickFile("zip");
      if (!file) return;
      setImporting(true);
      const parsed = parseSamsungZip(file.bytes);
      setImporting(false);
      if (parsed.found.length === 0) {
        notify(
          "Nothing found",
          "That file didn't contain Samsung Health data the app recognises.",
        );
        return;
      }
      sources.addImport({
        name: file.name,
        kind: "samsung",
        found: parsed.found,
        metrics: parsed.metrics,
        days: parsed.days,
      });
      notify(
        "Imported",
        `Found: ${parsed.found.join(", ")}. It's now part of your patterns.`,
      );
    } catch {
      setImporting(false);
      notify(
        "Couldn't read that file",
        "Make sure it's the zip from Samsung Health → Settings → Download personal data.",
      );
    }
  };

  const importCsv = async () => {
    try {
      const file = await pickFile("csv");
      if (!file) return;
      const table = parseCsv(bytesToText(file.bytes));
      if (table.headers.length < 2 || table.rows.length === 0) {
        notify(
          "Couldn't read that file",
          "It needs a header row, a date column and at least one number column.",
        );
        return;
      }
      setCsvFile({ name: file.name, table });
    } catch {
      notify(
        "Couldn't read that file",
        "Try saving it as CSV (comma separated) and importing again.",
      );
    }
  };

  const loadDemo = () => {
    confirmAction(
      "Load demo data?",
      "Replaces your logs with four months of made-up data so you can see insights.",
      "Load",
      () => {
        const demo = generateSyntheticData({
          days: 120,
          seed: Date.now() % 1000,
          now: new Date(),
          gaps: "planted",
          drift: false,
        });
        loadDemoData(demo.bundle);
        const town = { name: "Demo town", latitude: 51.5, longitude: -0.1 };
        updateInsightSettings({
          weatherEnabled: true,
          weatherMode: "town",
          homeTown: town,
        });
        sources.loadDemoWeather(demo.weather.days, town);
        if (!isModuleEnabled("cycleTracker")) toggleModule("cycleTracker");
      },
    );
  };

  const healthDescription = (() => {
    if (Platform.OS === "web") return "Available in the phone app";
    if (!sources.healthAvailable) {
      return Platform.OS === "android"
        ? "Needs Health Connect and the full app build (not Expo Go)"
        : "Needs the full app build (not Expo Go)";
    }
    if (sources.health.provider) {
      return `${sources.healthLabel} · ${sources.health.types.length} types · synced ${since(sources.health.lastSync)}`;
    }
    return Platform.OS === "android"
      ? "Read steps, sleep, heart rate, cycle and more from Samsung Health and others"
      : "Read steps, sleep, heart rate, cycle and more";
  })();

  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      backgroundColor: theme.surfaceVariant,
      fontSize: typography.body.fontSize,
    },
  ];

  return (
    <>
      <SettingsSection title="INSIGHTS & PREDICTIONS">
        <SettingsRow
          icon="hash"
          label="Show the numbers"
          description="Off: plain words. On: averages, ranges and how many days each pattern is based on"
          rightElement={
            <SettingsSwitch
              value={s.showNumbers}
              onChange={(v) => updateInsightSettings({ showNumbers: v })}
            />
          }
        />

        <SettingsRow
          icon="cloud"
          label="Weather"
          description="Temperature, humidity, pressure, air quality and pollen. Sends only your approximate area (about 10 km) to Open-Meteo"
          rightElement={
            <SettingsSwitch
              value={s.weatherEnabled}
              onChange={(v) => updateInsightSettings({ weatherEnabled: v })}
            />
          }
        />
        {s.weatherEnabled ? (
          <View style={[styles.sub, { borderBottomColor: theme.divider }]}>
            <View style={sheetStyles.chips}>
              <ChoiceChip
                label="Use my rough location"
                icon="navigation"
                selected={s.weatherMode === "gps"}
                onPress={() => updateInsightSettings({ weatherMode: "gps" })}
              />
              <ChoiceChip
                label="Use a home town"
                icon="home"
                selected={s.weatherMode === "town"}
                onPress={() => updateInsightSettings({ weatherMode: "town" })}
              />
            </View>
            {s.weatherMode === "town" ? (
              <>
                <View style={styles.searchRow}>
                  <TextInput
                    value={townQuery}
                    onChangeText={setTownQuery}
                    placeholder={s.homeTown?.name ?? "Type your town"}
                    placeholderTextColor={theme.textSecondary}
                    onSubmitEditing={searchTown}
                    returnKeyType="search"
                    style={[inputStyle, { flex: 1 }]}
                  />
                  <Pressable
                    onPress={searchTown}
                    style={[
                      styles.iconButton,
                      { backgroundColor: theme.primary },
                    ]}
                    accessibilityLabel="Search towns"
                  >
                    <Feather name="search" size={18} color={theme.buttonText} />
                  </Pressable>
                </View>
                {towns.map((t) => (
                  <Pressable
                    key={`${t.name}-${t.latitude}`}
                    onPress={() => {
                      updateInsightSettings({ homeTown: t });
                      setTowns([]);
                      setTownQuery("");
                    }}
                    style={styles.townRow}
                  >
                    <Feather name="map-pin" size={14} color={theme.primary} />
                    <ThemedText type="small">{t.name}</ThemedText>
                  </Pressable>
                ))}
              </>
            ) : null}
            <View style={styles.statusRow}>
              {sources.weatherStatus.loading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null}
              <ThemedText
                type="caption"
                style={{
                  color: sources.weatherStatus.error
                    ? theme.error
                    : theme.textSecondary,
                  flex: 1,
                }}
              >
                {sources.weatherStatus.error ??
                  (sources.weather.fetchedOn
                    ? `Updated ${formatDayShort(sources.weather.fetchedOn)}${sources.weather.placeName ? ` for ${sources.weather.placeName}` : ""} · ${Object.keys(sources.weather.days).length} days`
                    : "Not fetched yet")}
              </ThemedText>
              <Pressable
                onPress={() => sources.refreshWeather(true)}
                hitSlop={8}
              >
                <ThemedText
                  type="caption"
                  style={{ color: theme.primary, fontWeight: "600" }}
                >
                  Refresh
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {sources.stepsAvailable ? (
          <SettingsRow
            icon="navigation"
            label="Phone step count"
            description="Reads the last week of steps from this iPhone"
            rightElement={
              <SettingsSwitch
                value={s.stepsEnabled}
                onChange={(v) => updateInsightSettings({ stepsEnabled: v })}
              />
            }
          />
        ) : null}

        <SettingsRow
          icon="heart"
          label={
            Platform.OS === "android"
              ? "Samsung Health & Health Connect"
              : "Apple Health"
          }
          description={healthDescription}
          onPress={
            sources.healthAvailable ? () => setSheet("health") : undefined
          }
          rightElement={
            sources.healthAvailable ? (
              <Feather
                name="chevron-right"
                size={20}
                color={theme.textSecondary}
              />
            ) : undefined
          }
        />
        {sources.health.provider ? (
          <View
            style={[
              styles.sub,
              styles.inlineActions,
              { borderBottomColor: theme.divider },
            ]}
          >
            <Pressable onPress={() => sources.syncHealth(true)} hitSlop={8}>
              <ThemedText
                type="small"
                style={{ color: theme.primary, fontWeight: "600" }}
              >
                {sources.healthStatus.syncing ? "Syncing…" : "Sync now"}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() =>
                confirmAction(
                  "Disconnect?",
                  "Stops reading health data and removes what was copied into this app.",
                  "Disconnect",
                  sources.disconnectHealth,
                )
              }
              hitSlop={8}
            >
              <ThemedText
                type="small"
                style={{ color: theme.error, fontWeight: "600" }}
              >
                Disconnect
              </ThemedText>
            </Pressable>
            {sources.healthStatus.error ? (
              <ThemedText
                type="caption"
                style={{ color: theme.error, flexBasis: "100%" }}
              >
                {sources.healthStatus.error}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        <SettingsRow
          icon="upload"
          label="Import Samsung Health export"
          description="The zip from Samsung Health → Settings → Download personal data (fills in older history)"
          onPress={importSamsung}
          rightElement={
            importing ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Feather
                name="chevron-right"
                size={20}
                color={theme.textSecondary}
              />
            )
          }
        />
        <SettingsRow
          icon="file-text"
          label="Import a spreadsheet (CSV)"
          description="From Fitbit, Garmin, Oura or your own sheet: each number column becomes something to analyse"
          onPress={importCsv}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
        />
        {sources.imports.map((b) => (
          <View
            key={b.id}
            style={[
              styles.sub,
              styles.importRow,
              { borderBottomColor: theme.divider },
            ]}
          >
            <Feather
              name={b.kind === "samsung" ? "heart" : "file-text"}
              size={16}
              color={theme.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <ThemedText type="small" numberOfLines={1}>
                {b.name}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {(b.found ?? b.metrics.map((m) => m.label)).join(", ")} ·{" "}
                {Object.keys(b.days).length} days
              </ThemedText>
            </View>
            <Pressable
              onPress={() =>
                confirmAction(
                  "Remove this import?",
                  "Everything from this file is removed from the app.",
                  "Remove",
                  () => sources.removeImport(b.id),
                )
              }
              hitSlop={10}
              accessibilityLabel={`Remove ${b.name}`}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          </View>
        ))}

        <SettingsRow
          icon="sliders"
          label="My trackers"
          description="Track anything else (pain, screen time, social time); every tracker is analysed"
          onPress={() => setSheet("trackers")}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
        />
        <SettingsRow
          icon="coffee"
          label="Food & drink logging"
          description="Quick-log meals and drinks from the Track tab"
          rightElement={
            <SettingsSwitch
              value={isModuleEnabled("intake")}
              onChange={() => toggleModule("intake")}
            />
          }
        />
        <SettingsRow
          icon="wind"
          label="Substance logging"
          description="Caffeine, alcohol, nicotine and others. Off by default; stays on your phone"
          rightElement={
            <SettingsSwitch
              value={s.substancesEnabled}
              onChange={(v) => updateInsightSettings({ substancesEnabled: v })}
            />
          }
        />
        <SettingsRow
          icon="tag"
          label="Food tags & substances"
          description="Choose which options appear when logging"
          onPress={() => setSheet("intake")}
          rightElement={
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          }
        />
        <SettingsRow
          icon="droplet"
          label="Cycle tracking"
          description="Log period days and see how your cycle links to how you feel"
          rightElement={
            <SettingsSwitch
              value={isModuleEnabled("cycleTracker")}
              onChange={() => toggleModule("cycleTracker")}
            />
          }
        />

        <SettingsRow
          icon="bell"
          label="Gentle medication nudges"
          description="A reminder only once it's later than your usual time and nothing's logged"
          rightElement={
            <SettingsSwitch
              value={s.medNudges}
              onChange={(v) => updateInsightSettings({ medNudges: v })}
            />
          }
        />
        <SettingsRow
          icon="sunset"
          label="Evening outlook"
          description="An 8pm heads-up, only when tomorrow looks like a heavier day"
          rightElement={
            <SettingsSwitch
              value={s.outlookNotifications}
              onChange={(v) =>
                updateInsightSettings({ outlookNotifications: v })
              }
            />
          }
        />
        <SettingsRow
          icon="pause-circle"
          label="Low-effort check-ins"
          description="When you're likely to go quiet, a notification you can answer with one tap (Rough / OK / Good)"
          rightElement={
            <SettingsSwitch
              value={s.lowEffortCheckins}
              onChange={(v) => updateInsightSettings({ lowEffortCheckins: v })}
            />
          }
        />
        <SettingsRow
          icon="heart"
          label="Medication heads-ups"
          description="Notice when med logging dips during a stretch of feeling better. Never medical advice"
          rightElement={
            <SettingsSwitch
              value={s.medSlipHeadsUp}
              onChange={(v) => updateInsightSettings({ medSlipHeadsUp: v })}
            />
          }
          isLast={!__DEV__}
        />
        {__DEV__ ? (
          <SettingsRow
            icon="database"
            label="Load demo data (development)"
            description="Fill the app with made-up data to check the insight screens"
            onPress={loadDemo}
            isLast
          />
        ) : null}
      </SettingsSection>

      <TrackerManager
        visible={sheet === "trackers"}
        onClose={() => setSheet(null)}
      />
      <IntakeConfigSheet
        visible={sheet === "intake"}
        onClose={() => setSheet(null)}
      />
      <HealthDataSheet
        visible={sheet === "health"}
        onClose={() => setSheet(null)}
      />
      <CsvImportSheet file={csvFile} onClose={() => setCsvFile(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  sub: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  searchRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  townRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minHeight: 40,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  importRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
});
