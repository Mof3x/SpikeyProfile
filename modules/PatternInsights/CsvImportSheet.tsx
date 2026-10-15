import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import {
  ChoiceChip,
  SaveButton,
  SheetModal,
  sheetStyles,
} from "@/components/SheetModal";
import { useTheme } from "@/hooks/useTheme";
import { useSources } from "@/core/sources/SourcesContext";
import {
  csvToDaily,
  guessMapping,
  parseDateCell,
  type CsvMapping,
  type CsvTable,
} from "@/core/sources/importers/csv";
import { dayKey, formatDayShort } from "@/core/analytics/dates";
import { Spacing } from "@/constants/theme";

/** Confirm which column is the date and which numbers to import; each becomes something the app analyses. */
export function CsvImportSheet({
  file,
  onClose,
}: {
  file: { name: string; table: CsvTable } | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { addImport } = useSources();
  const [mapping, setMapping] = useState<CsvMapping | null>(null);

  useEffect(() => {
    setMapping(file ? guessMapping(file.table) : null);
  }, [file]);

  const preview = useMemo(() => {
    if (!file || !mapping || mapping.dateColumn < 0) return null;
    const dates = file.table.rows
      .map((r) => parseDateCell(r[mapping.dateColumn] ?? "", mapping.dayFirst))
      .filter((d): d is Date => d !== null)
      .map((d) => dayKey(d))
      .sort();
    if (!dates.length) return null;
    return {
      first: dates[0],
      last: dates[dates.length - 1],
      count: new Set(dates).size,
    };
  }, [file, mapping]);

  if (!file || !mapping) return null;
  const included = mapping.columns.filter((c) => c.include).length;

  const save = () => {
    const { metrics, days } = csvToDaily(file.table, mapping);
    addImport({ name: file.name, kind: "csv", metrics, days });
    onClose();
  };

  return (
    <SheetModal visible title="Import a spreadsheet" onClose={onClose}>
      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
      >
        {file.name} · {file.table.rows.length} rows. Read on your phone; nothing
        is uploaded.
      </ThemedText>

      <ThemedText type="small" style={sheetStyles.label}>
        Which column has the date?
      </ThemedText>
      <View style={sheetStyles.chips}>
        {file.table.headers.map((h, i) => (
          <ChoiceChip
            key={`${h}-${i}`}
            label={h || `Column ${i + 1}`}
            selected={mapping.dateColumn === i}
            onPress={() =>
              setMapping({
                ...mapping,
                dateColumn: i,
                columns: mapping.columns.filter((c) => c.column !== i),
              })
            }
          />
        ))}
      </View>
      <View style={styles.inlineRow}>
        <ThemedText type="small" style={{ flex: 1 }}>
          Dates are written day first (e.g. 31/01/2026)
        </ThemedText>
        <Switch
          value={mapping.dayFirst}
          onValueChange={(v) => setMapping({ ...mapping, dayFirst: v })}
          trackColor={{ false: "#3A4150", true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
      {preview ? (
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {preview.count} days, {formatDayShort(preview.first)} to{" "}
          {formatDayShort(preview.last)}
        </ThemedText>
      ) : (
        <ThemedText type="caption" style={{ color: theme.error }}>
          No dates found in that column.
        </ThemedText>
      )}

      <ThemedText type="small" style={sheetStyles.label}>
        Numbers to import
      </ThemedText>
      {mapping.columns.length === 0 ? (
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          No number columns found.
        </ThemedText>
      ) : null}
      {mapping.columns.map((c, idx) => (
        <View
          key={c.column}
          style={[styles.columnRow, { borderBottomColor: theme.divider }]}
        >
          <Pressable
            onPress={() => {
              const columns = [...mapping.columns];
              columns[idx] = { ...c, include: !c.include };
              setMapping({ ...mapping, columns });
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
              flex: 1,
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: c.include }}
          >
            <Feather
              name={c.include ? "check-square" : "square"}
              size={20}
              color={c.include ? theme.primary : theme.textSecondary}
            />
            <ThemedText type="body" style={{ flex: 1 }} numberOfLines={1}>
              {c.label}
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              const columns = [...mapping.columns];
              columns[idx] = {
                ...c,
                combine: c.combine === "sum" ? "mean" : "sum",
              };
              setMapping({ ...mapping, columns });
            }}
            accessibilityRole="button"
            accessibilityHint="Switches between adding up and averaging values on the same day"
          >
            <ThemedText
              type="caption"
              style={{ color: theme.primary, fontWeight: "600" }}
            >
              {c.combine === "sum" ? "Add up per day" : "Average per day"}
            </ThemedText>
          </Pressable>
        </View>
      ))}

      <SaveButton
        label={`Import ${included} column${included === 1 ? "" : "s"}`}
        onPress={save}
        disabled={!preview || included === 0}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  columnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
