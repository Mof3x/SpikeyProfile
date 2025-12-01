import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useModules } from "@/core/ModuleContext";
import { useData, WidgetId, DEFAULT_WIDGET_ORDER } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

import { GamificationCard } from "@/modules/Gamification/GamificationCard";
import { TodaySummaryCard } from "@/modules/SymptomTracker/TodaySummaryCard";
import { ClipboardPreview } from "@/modules/ClipboardTray/ClipboardPreview";
import { QuickInsightCard } from "@/modules/PatternInsights/QuickInsightCard";
import { TodoWidget } from "@/modules/TodoList/TodoWidget";
import { UpcomingEventsWidget } from "@/modules/Calendar/UpcomingEventsWidget";
import { NFCQuickLogCard } from "@/modules/NFCModule/NFCQuickLog";
import { PomodoroTimerCard } from "@/modules/Pomodoro/PomodoroTimer";
import { EmergencyButtonCard } from "@/modules/Emergency/EmergencyButton";
import { AutomatedAlarms } from "@/modules/Alarms/AutomatedAlarms";
import { CountdownTimerCard } from "@/modules/Timers/CountdownTimerCard";
import { CountUpTimerCard } from "@/modules/Timers/CountUpTimerCard";

interface WidgetConfig {
  id: WidgetId;
  name: string;
  icon: string;
  component: React.ReactNode | null;
}

function WidgetReorderModal({
  visible,
  onClose,
  widgetOrder,
  onSave,
  enabledModules,
}: {
  visible: boolean;
  onClose: () => void;
  widgetOrder: WidgetId[];
  onSave: (order: WidgetId[]) => void;
  enabledModules: Set<string>;
}) {
  const { theme } = useTheme();
  const [tempOrder, setTempOrder] = useState<WidgetId[]>(widgetOrder);

  const widgetNames: Record<WidgetId, { name: string; icon: string }> = {
    gamification: { name: "Progress & XP", icon: "award" },
    symptomTracker: { name: "Today's Summary", icon: "activity" },
    todoList: { name: "To-Do List", icon: "check-square" },
    calendar: { name: "Upcoming Events", icon: "calendar" },
    nfcModule: { name: "Quick Log", icon: "smartphone" },
    pomodoro: { name: "Focus Timer", icon: "clock" },
    alarms: { name: "Automated Alarms", icon: "bell" },
    clipboardTray: { name: "Clipboard Tray", icon: "clipboard" },
    patternInsights: { name: "Pattern Insights", icon: "bar-chart-2" },
    emergency: { name: "Emergency", icon: "alert-circle" },
    countdown: { name: "Countdown Timer", icon: "clock" },
    countup: { name: "Time Since...", icon: "activity" },
  };

  const moveWidget = (index: number, direction: "up" | "down") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newOrder = [...tempOrder];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      setTempOrder(newOrder);
    }
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(tempOrder);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTempOrder(DEFAULT_WIDGET_ORDER);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Customize Widget Order</ThemedText>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
            Drag widgets to rearrange your home screen. Disabled widgets won't appear.
          </ThemedText>

          <View style={styles.widgetList}>
            {tempOrder.map((widgetId, index) => {
              const widget = widgetNames[widgetId];
              const isEnabled = enabledModules.has(widgetId);
              
              return (
                <View 
                  key={widgetId} 
                  style={[
                    styles.widgetItem,
                    { 
                      backgroundColor: theme.surfaceVariant,
                      opacity: isEnabled ? 1 : 0.5,
                    }
                  ]}
                >
                  <View style={styles.widgetItemLeft}>
                    <Feather name={widget.icon as any} size={20} color={theme.text} />
                    <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                      {widget.name}
                    </ThemedText>
                    {!isEnabled ? (
                      <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
                        (disabled)
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.widgetItemRight}>
                    <Pressable
                      onPress={() => moveWidget(index, "up")}
                      disabled={index === 0}
                      style={[styles.moveButton, index === 0 && { opacity: 0.3 }]}
                    >
                      <Feather name="chevron-up" size={20} color={theme.text} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveWidget(index, "down")}
                      disabled={index === tempOrder.length - 1}
                      style={[styles.moveButton, index === tempOrder.length - 1 && { opacity: 0.3 }]}
                    >
                      <Feather name="chevron-down" size={20} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <Pressable
              onPress={handleReset}
              style={[styles.actionButton, { backgroundColor: theme.surfaceVariant }]}
            >
              <Feather name="rotate-ccw" size={16} color={theme.text} />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                Reset
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.actionButton, { backgroundColor: theme.primary, flex: 1 }]}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Save Order
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { isModuleEnabled } = useModules();
  const { userName, symptomEntries, widgetOrder, setWidgetOrder } = useData();
  const [showReorderModal, setShowReorderModal] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const displayName = userName || "there";
  const todayEntry = symptomEntries.find((e) => {
    const today = new Date();
    const entryDate = new Date(e.timestamp);
    return entryDate.toDateString() === today.toDateString();
  });

  const isWidgetModuleEnabled = useCallback((widgetId: WidgetId): boolean => {
    const widgetToModuleMap: Record<string, string> = {
      gamification: "gamification",
      symptomTracker: "symptomTracker",
      todoList: "todoList",
      calendar: "calendar",
      nfcModule: "nfcModule",
      pomodoro: "pomodoro",
      alarms: "alarms",
      clipboardTray: "clipboardTray",
      patternInsights: "patternInsights",
      emergency: "emergency",
      countdown: "countdownTimer",
      countup: "countUpTimer",
    };
    const moduleId = widgetToModuleMap[widgetId];
    if (!moduleId) return false;
    return isModuleEnabled(moduleId as any);
  }, [isModuleEnabled]);

  const enabledModulesSet = new Set(
    widgetOrder.filter((id) => isWidgetModuleEnabled(id))
  );

  const renderWidget = useCallback((widgetId: WidgetId): React.ReactNode | null => {
    if (!isWidgetModuleEnabled(widgetId)) return null;

    switch (widgetId) {
      case "gamification":
        return <GamificationCard />;
      case "symptomTracker":
        return <TodaySummaryCard entry={todayEntry} />;
      case "todoList":
        return <TodoWidget />;
      case "calendar":
        return <UpcomingEventsWidget />;
      case "nfcModule":
        return <NFCQuickLogCard />;
      case "pomodoro":
        return <PomodoroTimerCard />;
      case "alarms":
        return <AutomatedAlarms />;
      case "countdown":
        return <CountdownTimerCard />;
      case "countup":
        return <CountUpTimerCard />;
      case "clipboardTray":
        return <ClipboardPreview />;
      case "patternInsights":
        return <QuickInsightCard />;
      case "emergency":
        return <EmergencyButtonCard />;
      default:
        return null;
    }
  }, [isWidgetModuleEnabled, todayEntry]);

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <ThemedText type="h2" style={styles.greeting}>
              {getGreeting()}, {displayName}
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              {todayEntry
                ? "You've logged today. How's it going?"
                : "Ready to check in?"}
            </ThemedText>
          </View>
          <View style={styles.headerButtons}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("DailyBrief");
              }}
              style={[styles.customizeButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="sun" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowReorderModal(true);
              }}
              style={[styles.customizeButton, { backgroundColor: theme.surfaceVariant }]}
            >
              <Feather name="sliders" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      {widgetOrder.map((widgetId) => {
        const widget = renderWidget(widgetId);
        if (!widget) return null;
        return (
          <React.Fragment key={widgetId}>
            {widget}
            <Spacer height={Spacing.lg} />
          </React.Fragment>
        );
      })}

      <Spacer height={Spacing["4xl"]} />

      <WidgetReorderModal
        visible={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        widgetOrder={widgetOrder}
        onSave={setWidgetOrder}
        enabledModules={enabledModulesSet}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.8,
  },
  headerButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  customizeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  widgetList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  widgetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  widgetItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  widgetItemRight: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  moveButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
});
