import type { PatternInsight } from "@/core/DataContext";
import { analyzeAdherenceDrift, type MedDrift } from "./adherenceDrift";
import {
  analysableFactorCount,
  findCorrelations,
  MIN_PAIRED_DAYS,
  type CorrelationSummary,
} from "./correlations";
import { analyzeCycle, collectPeriodDays, type CycleInfo } from "./cycle";
import { buildDailyTable, daysLogged } from "./dailyFeatures";
import {
  addDays,
  dayKey,
  describeTimeOfDay,
  formatClock,
  formatDayShort,
  WEEKDAY_NAMES,
} from "./dates";
import { analyzeEngagement, type EngagementSummary } from "./engagement";
import { forecastDay, MIN_FORECAST_DAYS, type DayForecast } from "./forecast";
import { analyzeMedications, type MedPattern } from "./medications";
import { findRhythms, type RhythmResult } from "./rhythm";
import { PATTERN_NOT_PROOF } from "./text";
import {
  toughDayOutlook,
  toughDayThreshold,
  type ToughDayOutlook,
} from "./toughDay";
import {
  FACTOR_GROUP_LABELS,
  type AnalyticsInput,
  type DailyTable,
  type FactorGroup,
} from "./types";

export interface AnalyticsProgress {
  daysLogged: number;
  patternDaysNeeded: number;
  forecastDaysNeeded: number;
  factorsTracked: number;
  analysableFactors: number;
  testedCount: number;
}

export interface AnalyticsResult {
  table: DailyTable;
  meds: MedPattern[];
  cycle: CycleInfo;
  correlations: CorrelationSummary;
  rhythms: RhythmResult[];
  forecastToday: DayForecast;
  forecastTomorrow?: DayForecast;
  toughToday?: ToughDayOutlook;
  toughTomorrow?: ToughDayOutlook;
  engagement: EngagementSummary;
  drift: MedDrift[];
  insights: PatternInsight[];
  progress: AnalyticsProgress;
}

const GROUP_ICONS: Record<FactorGroup, string> = {
  sleep: "moon",
  activity: "activity",
  body: "heart",
  meds: "plus-circle",
  habits: "check-circle",
  food: "coffee",
  substances: "coffee",
  weather: "cloud",
  cycle: "droplet",
  schedule: "calendar",
  trackers: "sliders",
  imported: "download",
};

const MAX_CORRELATION_INSIGHTS = 8;

function insight(
  id: string,
  title: string,
  icon: string,
  type: PatternInsight["type"],
  plain: string,
  numbers?: string,
  basis?: string,
): PatternInsight {
  return { id, title, icon, type, description: plain, plain, numbers, basis };
}

function buildInsights(r: Omit<AnalyticsResult, "insights">): PatternInsight[] {
  const out: PatternInsight[] = [];

  const tough = r.toughTomorrow?.warn
    ? r.toughTomorrow
    : r.toughToday?.warn
      ? r.toughToday
      : undefined;
  if (tough) {
    out.push(
      insight(
        `tough.${tough.day}`,
        "Heads-up",
        "alert-triangle",
        "warning",
        tough.plain,
        tough.numbers,
        "Forecast from your own past days. It can be wrong; it's here so you can plan gently.",
      ),
    );
  }

  for (const med of r.meds) {
    if (med.lateToday && med.usualMinutes !== undefined) {
      out.push(
        insight(
          `med.late.${med.actionId}`,
          `${med.name}`,
          "clock",
          "neutral",
          `${med.name} isn't logged yet today. You usually log it ${describeTimeOfDay(med.usualMinutes)}.`,
          `Usually logged around ${formatClock(med.usualMinutes)}; it's now later than your usual window (until ${formatClock(med.windowEnd!)}).`,
          "Based on your last logs of this medication.",
        ),
      );
    }
    if (med.daily && med.notLoggedStreak >= 3) {
      out.push(
        insight(
          `med.streak.${med.actionId}`,
          `${med.name}`,
          "info",
          "neutral",
          `${med.name} hasn't been logged for a few days. If you've been taking it, a quick log keeps your history accurate.`,
          `Not logged for ${med.notLoggedStreak} days in a row.`,
          "Counts days since your last log of this medication.",
        ),
      );
    }
  }

  for (const d of r.drift) {
    if (d.headsUp) {
      out.push(
        insight(
          `drift.live.${d.actionId}`,
          `${d.name}`,
          "heart",
          "neutral",
          d.headsUp.plain,
          d.headsUp.numbers,
          "Based on your own logging history and check-ins. Not medical advice.",
        ),
      );
    }
  }

  const risk = r.engagement.quietRisk;
  if (risk?.warn) {
    out.push(
      insight(
        "quiet.risk",
        "Logging",
        "pause-circle",
        "neutral",
        risk.plain,
        risk.numbers,
        "Based on when you've gone quiet before.",
      ),
    );
  }

  if (
    r.cycle.hasData &&
    r.cycle.predictedNextStart &&
    r.cycle.daysUntilNext !== undefined
  ) {
    const until = r.cycle.daysUntilNext;
    if (until >= 0 && until <= 10) {
      const plainWhen =
        until <= 1
          ? "very soon"
          : until <= 4
            ? "in the next few days"
            : "in about a week";
      out.push(
        insight(
          "cycle.next",
          "Cycle",
          "droplet",
          "neutral",
          `Your next period is likely ${plainWhen}${r.cycle.irregular ? ", though your cycle varies so this is a rough guess" : ""}.`,
          `Predicted start ${formatDayShort(r.cycle.predictedNextStart)}${
            r.cycle.predictedRange
              ? ` (range ${formatDayShort(r.cycle.predictedRange[0])} – ${formatDayShort(r.cycle.predictedRange[1])})`
              : ""
          } · typical cycle ${r.cycle.medianLength} days`,
          "Estimated from the period days you've logged. Not suitable for contraception.",
        ),
      );
    }
  }

  for (const c of r.correlations.results.slice(0, MAX_CORRELATION_INSIGHTS)) {
    out.push(
      insight(
        `corr.${c.id}`,
        `${c.factor.label} & ${c.symptom.label.toLowerCase()}`,
        GROUP_ICONS[c.factor.group],
        c.good ? "positive" : "warning",
        c.plain,
        `${c.numbers} · ${c.confidence}`,
        `${FACTOR_GROUP_LABELS[c.factor.group]}. ${PATTERN_NOT_PROOF}`,
      ),
    );
  }

  for (const rhythm of r.rhythms) {
    out.push(
      insight(
        `rhythm.${rhythm.symptom.key}`,
        "Time of day",
        "sun",
        "positive",
        rhythm.plain,
        rhythm.numbers,
        PATTERN_NOT_PROOF,
      ),
    );
  }

  for (const lead of r.engagement.leadUps.slice(0, 3)) {
    out.push(
      insight(
        `lead.${lead.id}`,
        "Logging patterns",
        "pause-circle",
        "neutral",
        lead.plain,
        lead.numbers,
        "Based on the days you did and didn't log.",
      ),
    );
  }

  for (const d of r.drift) {
    if (d.patternInsight) {
      out.push(
        insight(
          `drift.${d.actionId}`,
          d.name,
          "heart",
          "neutral",
          d.patternInsight.plain,
          d.patternInsight.numbers,
          "Based on your own logging history. Not medical advice.",
        ),
      );
    }
  }

  for (const med of r.meds) {
    if (med.weakWeekday) {
      const wd = WEEKDAY_NAMES[med.weakWeekday.weekday];
      out.push(
        insight(
          `med.weekday.${med.actionId}`,
          med.name,
          "calendar",
          "neutral",
          `${med.name} is less often logged on ${wd}.`,
          `Not logged on ${med.weakWeekday.notLogged} of ${med.weakWeekday.total} ${wd}.`,
          "Based on your medication logs.",
        ),
      );
    }
  }

  if (r.engagement.biasWarning) {
    out.push(
      insight(
        "bias",
        "About your averages",
        "info",
        "neutral",
        r.engagement.biasWarning.plain,
        r.engagement.biasWarning.numbers,
        "Based on the days before you stopped logging.",
      ),
    );
  }

  if (r.correlations.results.length === 0 && out.length === 0) {
    const logged = r.progress.daysLogged;
    if (logged < MIN_PAIRED_DAYS) {
      out.push(
        insight(
          "progress",
          "Keep logging",
          "trending-up",
          "neutral",
          "A few more days of check-ins and your patterns will start to appear.",
          `${logged} of ${MIN_PAIRED_DAYS} days logged so far.`,
          "Patterns need at least two weeks of check-ins so one-off days don't mislead you.",
        ),
      );
    } else {
      out.push(
        insight(
          "noPatterns",
          "No clear patterns yet",
          "search",
          "neutral",
          "Nothing stands out strongly yet. That's normal, and the app keeps checking as you log.",
          `${r.correlations.testedCount} possible links checked across ${logged} days; none were consistent enough to show.`,
          "Only links that hold up across your data are shown, to avoid coincidences.",
        ),
      );
    }
  }

  return out;
}

export function runAnalytics(input: AnalyticsInput): AnalyticsResult {
  const meds = analyzeMedications(
    input.quickLogActions,
    input.quickLogEntries,
    input.now,
  );
  const periodDays = collectPeriodDays(input.periodDays, input.external);
  const cycle = analyzeCycle(periodDays, dayKey(input.now), input.ageRange);
  const table = buildDailyTable(input, { meds, cycle });
  const correlations = findCorrelations(table);
  const rhythms = findRhythms(input.symptomEntries);

  const forecastToday = forecastDay(table, table.today);
  const todayRow = table.byDay.get(table.today);
  const forecastTomorrow =
    todayRow?.load !== undefined
      ? forecastDay(table, addDays(table.today, 1))
      : undefined;
  const toughToday = toughDayOutlook(
    table,
    forecastToday,
    input.dayNotes,
    "Today",
  );
  const toughTomorrow = forecastTomorrow
    ? toughDayOutlook(table, forecastTomorrow, input.dayNotes, "Tomorrow")
    : undefined;

  const engagement = analyzeEngagement(
    input,
    table,
    cycle,
    toughDayThreshold(table, input.dayNotes),
  );
  const drift = analyzeAdherenceDrift(table, meds);

  const progress: AnalyticsProgress = {
    daysLogged: daysLogged(table),
    patternDaysNeeded: MIN_PAIRED_DAYS,
    forecastDaysNeeded: MIN_FORECAST_DAYS,
    factorsTracked: table.factors.length,
    analysableFactors: analysableFactorCount(table),
    testedCount: correlations.testedCount,
  };

  const partial = {
    table,
    meds,
    cycle,
    correlations,
    rhythms,
    forecastToday,
    forecastTomorrow,
    toughToday,
    toughTomorrow,
    engagement,
    drift,
    progress,
  };
  return { ...partial, insights: buildInsights(partial) };
}

export const EMPTY_ANALYTICS: AnalyticsResult = runAnalytics({
  now: new Date(),
  symptomEntries: [],
  quickLogActions: [],
  quickLogEntries: [],
  todos: [],
  calendarEvents: [],
  countdownTimers: [],
  customTrackers: [],
  customTrackerEntries: [],
  exerciseEntries: [],
  intakeEntries: [],
  intakeConfig: { tags: [], hiddenTags: [], substances: [] },
  focusSessions: [],
  periodDays: [],
  dayNotes: [],
  ageRange: null,
  external: [],
});

export * from "./types";
export type { DayKey } from "./dates";
