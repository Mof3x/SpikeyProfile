import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, Switch, Alert, Platform, ScrollView, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useData, AlarmSchedule } from "@/core/DataContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function AutomatedAlarms() {
  const { theme, typography } = useTheme();
  const { alarmSchedules, addAlarmSchedule, updateAlarmSchedule, removeAlarmSchedule, toggleAlarmSchedule } = useData();
  
  recurrenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recurrenceInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: "center",
  },
  recurrenceUnitButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AlarmSchedule | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newStartTime, setNewStartTime] = useState(new Date());
  const [newEndTime, setNewEndTime] = useState(new Date(Date.now() + 3600000 * 4));
  const [newNumberOfAlarms, setNewNumberOfAlarms] = useState(4);
  const [newIntervalType, setNewIntervalType] = useState<"uniform" | "custom">("uniform");
  const [newVibrate, setNewVibrate] = useState(true);
  const [newRecurrenceEnabled, setNewRecurrenceEnabled] = useState(false);
  const [newRecurrenceEvery, setNewRecurrenceEvery] = useState("1");
  const [newRecurrenceUnit, setNewRecurrenceUnit] = useState<"days" | "weeks">("days");
  const [newRecurrenceHasEndDate, setNewRecurrenceHasEndDate] = useState(false);
  const [newRecurrenceEndDate, setNewRecurrenceEndDate] = useState(new Date());
  const [showRecurrenceEndPicker, setShowRecurrenceEndPicker] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const pendingScheduleRef = useRef<Omit<AlarmSchedule, "id" | "createdAt" | "notificationIds"> | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      setPermissionStatus(null);
      return;
    }
    
    const { status, canAskAgain: askAgain } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    setCanAskAgain(askAgain);
    setHasPermission(status === "granted");
  };

  const refreshPermissionState = async () => {
    if (Platform.OS === "web") {
      setHasPermission(false);
      setPermissionStatus(null);
      return false;
    }
    const { status, canAskAgain: askAgain } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    setCanAskAgain(askAgain);
    const granted = status === "granted";
    setHasPermission(granted);
    return granted;
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Web Platform",
        "Notifications are not fully supported on web. For the best experience, please use Expo Go on your phone."
      );
      return false;
    }

    const { status, canAskAgain: askAgain } = await Notifications.getPermissionsAsync();
    
    if (status === "granted") {
      setHasPermission(true);
      setPermissionStatus(status);
      return true;
    }

    if (status === "denied" && !askAgain) {
      Alert.alert(
        "Notifications Blocked",
        "Notifications are blocked for this app. Would you like to open Settings to enable them?",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Open Settings",
            onPress: async () => {
              try {
                await Linking.openSettings();
                setTimeout(() => refreshPermissionState(), 1000);
              } catch (e) {
                console.log("Could not open settings");
              }
            },
          },
        ]
      );
      setCanAskAgain(false);
      return false;
    }

    const { status: newStatus, canAskAgain: newAskAgain } = await Notifications.requestPermissionsAsync();
    const granted = newStatus === "granted";
    setPermissionStatus(newStatus);
    setCanAskAgain(newAskAgain);
    setHasPermission(granted);
    
    if (!granted) {
      Alert.alert(
        "Notifications Needed",
        "To receive alarms, we need permission to send notifications. Your schedules will be saved but won't send alerts until you enable notifications."
      );
      return false;
    }
    
    return true;
  };

  const calculateAlarmTimes = (startTime: Date, endTime: Date, count: number): Date[] => {
    const times: Date[] = [];
    if (count <= 0) return times;
    if (count === 1) {
      times.push(new Date(startTime));
      return times;
    }

    const totalDuration = endTime.getTime() - startTime.getTime();
    const interval = totalDuration / (count - 1);

    for (let i = 0; i < count; i++) {
      const alarmTime = new Date(startTime.getTime() + interval * i);
      times.push(alarmTime);
    }

    return times;
  };

  const buildDateWithTime = (dateBase: Date, timeSource: Date) => {
    return new Date(
      dateBase.getFullYear(),
      dateBase.getMonth(),
      dateBase.getDate(),
      timeSource.getHours(),
      timeSource.getMinutes(),
      timeSource.getSeconds(),
      timeSource.getMilliseconds(),
    );
  };

  const getRecurrenceDates = (schedule: AlarmSchedule): Date[] => {
    const dates: Date[] = [];
    const startDate = new Date(schedule.startTime);
    const baseDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    if (!schedule.recurrenceEnabled) {
      dates.push(baseDate);
      return dates;
    }

    const every = Math.max(1, schedule.recurrenceEvery || 1);
    const stepDays = schedule.recurrenceUnit === "weeks" ? every * 7 : every;
    const limit = schedule.recurrenceEndDate
      ? new Date(schedule.recurrenceEndDate)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    for (let d = new Date(baseDate); d <= limit; d.setDate(d.getDate() + stepDays)) {
      dates.push(new Date(d));
    }

    return dates;
  };

  const scheduleNotifications = async (schedule: AlarmSchedule, skipPermissionCheck = false) => {
    if (Platform.OS === "web") return [];
    
    if (!skipPermissionCheck) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") return [];
    }

    const notificationIds: string[] = [];
    const recurrenceDates = getRecurrenceDates(schedule);

    for (const dateBase of recurrenceDates) {
      const startTime = buildDateWithTime(dateBase, schedule.startTime);
      const endTime = buildDateWithTime(dateBase, schedule.endTime);
      const alarmTimes = calculateAlarmTimes(startTime, endTime, schedule.numberOfAlarms);

      for (let i = 0; i < alarmTimes.length; i++) {
        const alarmTime = alarmTimes[i];
        const now = new Date();

        if (alarmTime > now) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: schedule.name,
              body: `Alarm ${i + 1} of ${schedule.numberOfAlarms}`,
              sound: true,
              vibrate: schedule.vibrate ? [0, 250, 250, 250] : undefined,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: alarmTime,
            },
          });
          notificationIds.push(id);
        }
      }
    }

    return notificationIds;
  };

  const cancelNotifications = async (notificationIds: string[]) => {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  };

  const handleAddSchedule = async () => {
    if (!newName.trim()) {
      Alert.alert("Name needed", "Please give your alarm schedule a name.");
      return;
    }

    if (newEndTime <= newStartTime) {
      Alert.alert("Check your times", "The end time should be after the start time.");
      return;
    }

    const recurrenceEvery = Math.max(1, parseInt(newRecurrenceEvery || "1", 10));
    if (newRecurrenceEnabled && newRecurrenceHasEndDate && newRecurrenceEndDate < newStartTime) {
      Alert.alert("Check recurrence", "The recurrence end date should be after the start date.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const schedule: Omit<AlarmSchedule, "id" | "createdAt" | "notificationIds"> = {
      name: newName.trim(),
      enabled: true,
      startTime: newStartTime,
      endTime: newEndTime,
      numberOfAlarms: newNumberOfAlarms,
      intervalType: newIntervalType,
      sound: "default",
      vibrate: newVibrate,
      recurrenceEnabled: newRecurrenceEnabled,
      recurrenceEvery,
      recurrenceUnit: newRecurrenceUnit,
      recurrenceEndDate: newRecurrenceHasEndDate ? newRecurrenceEndDate : null,
    };

    if (Platform.OS !== "web") {
      const hasNotificationPermission = await requestPermission();
      
      if (hasNotificationPermission) {
        const tempSchedule: AlarmSchedule = {
          ...schedule,
          id: Date.now().toString(),
          createdAt: new Date(),
          notificationIds: [],
        };
        
        const notificationIds = await scheduleNotifications(tempSchedule, true);
        
        addAlarmSchedule(schedule);
        
        setTimeout(() => {
          const latestSchedules = alarmSchedules;
          const newSchedule = latestSchedules.find(s => s.name === schedule.name && s.notificationIds.length === 0);
          if (newSchedule) {
            updateAlarmSchedule(newSchedule.id, { notificationIds });
          }
        }, 100);
        
        if (notificationIds.length > 0) {
          Alert.alert(
            "Alarms Set",
            `${notificationIds.length} alarm${notificationIds.length > 1 ? 's' : ''} scheduled for "${schedule.name}".`
          );
        } else {
          Alert.alert(
            "Schedule Saved",
            "Your schedule is saved, but no alarms were set (times may be in the past). Try adjusting the times."
          );
        }
      } else {
        addAlarmSchedule({ ...schedule, enabled: false });
        Alert.alert(
          "Schedule Saved",
          "Your schedule is saved but disabled. Enable notifications to receive alerts."
        );
      }
    } else {
      addAlarmSchedule({ ...schedule, enabled: false });
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleToggleSchedule = async (schedule: AlarmSchedule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (schedule.enabled) {
      await cancelNotifications(schedule.notificationIds);
      updateAlarmSchedule(schedule.id, { notificationIds: [] });
      toggleAlarmSchedule(schedule.id);
    } else {
      if (Platform.OS === "web") {
        Alert.alert(
          "Web Platform",
          "Alarms cannot be scheduled on web. Please use Expo Go on your phone for full functionality."
        );
        return;
      }
      
      const hasNotificationPermission = await requestPermission();
      
      if (!hasNotificationPermission) {
        return;
      }
      
      const newIds = await scheduleNotifications({ ...schedule, enabled: true }, true);
      
      if (newIds.length > 0) {
        updateAlarmSchedule(schedule.id, { notificationIds: newIds });
        toggleAlarmSchedule(schedule.id);
        Alert.alert(
          "Alarms Enabled",
          `${newIds.length} alarm${newIds.length > 1 ? 's' : ''} scheduled.`
        );
      } else {
        Alert.alert(
          "No Alarms Scheduled",
          "The alarm times have passed. Would you like to update the schedule times?",
          [
            { text: "Keep Disabled", style: "cancel" },
            { text: "Edit Schedule", onPress: () => handleEditSchedule(schedule) },
          ]
        );
      }
    }
  };

  const handleDeleteSchedule = async (schedule: AlarmSchedule) => {
    Alert.alert(
      "Remove alarm schedule?",
      `This will delete "${schedule.name}" and cancel any pending alarms.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await cancelNotifications(schedule.notificationIds);
            removeAlarmSchedule(schedule.id);
          },
        },
      ]
    );
  };

  const handleEditSchedule = (schedule: AlarmSchedule) => {
    setEditingSchedule(schedule);
    setNewName(schedule.name);
    setNewStartTime(new Date(schedule.startTime));
    setNewEndTime(new Date(schedule.endTime));
    setNewNumberOfAlarms(schedule.numberOfAlarms);
    setNewIntervalType(schedule.intervalType);
    setNewVibrate(schedule.vibrate);
    setNewRecurrenceEnabled(!!schedule.recurrenceEnabled);
    setNewRecurrenceEvery(String(schedule.recurrenceEvery || 1));
    setNewRecurrenceUnit(schedule.recurrenceUnit || "days");
    setNewRecurrenceHasEndDate(!!schedule.recurrenceEndDate);
    setNewRecurrenceEndDate(schedule.recurrenceEndDate ? new Date(schedule.recurrenceEndDate) : new Date());
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    
    if (!newName.trim()) {
      Alert.alert("Name needed", "Please give your alarm schedule a name.");
      return;
    }

    if (newEndTime <= newStartTime) {
      Alert.alert("Check your times", "The end time should be after the start time.");
      return;
    }

    const recurrenceEvery = Math.max(1, parseInt(newRecurrenceEvery || "1", 10));
    if (newRecurrenceEnabled && newRecurrenceHasEndDate && newRecurrenceEndDate < newStartTime) {
      Alert.alert("Check recurrence", "The recurrence end date should be after the start date.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await cancelNotifications(editingSchedule.notificationIds);

    const updates: Partial<AlarmSchedule> = {
      name: newName.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      numberOfAlarms: newNumberOfAlarms,
      intervalType: newIntervalType,
      vibrate: newVibrate,
      notificationIds: [],
      recurrenceEnabled: newRecurrenceEnabled,
      recurrenceEvery,
      recurrenceUnit: newRecurrenceUnit,
      recurrenceEndDate: newRecurrenceHasEndDate ? newRecurrenceEndDate : null,
    };

    if (editingSchedule.enabled) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        const newSchedule = { ...editingSchedule, ...updates };
        const newIds = await scheduleNotifications(newSchedule, true);
        updates.notificationIds = newIds;
      } else {
        updates.notificationIds = [];
      }
    }

    updateAlarmSchedule(editingSchedule.id, updates);
    setShowEditModal(false);
    setEditingSchedule(null);
    resetForm();
  };

  const resetForm = () => {
    setNewName("");
    setNewStartTime(new Date());
    setNewEndTime(new Date(Date.now() + 3600000 * 4));
    setNewNumberOfAlarms(4);
    setNewIntervalType("uniform");
    setNewVibrate(true);
    setNewRecurrenceEnabled(false);
    setNewRecurrenceEvery("1");
    setNewRecurrenceUnit("days");
    setNewRecurrenceHasEndDate(false);
    setNewRecurrenceEndDate(new Date());
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const calculateInterval = (startTime: Date, endTime: Date, count: number): string => {
    if (count <= 1) return "Single alarm";
    const totalMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const intervalMs = totalMs / (count - 1);
    const minutes = Math.round(intervalMs / 60000);
    
    if (minutes < 60) {
      return `Every ${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `Every ${hours}h ${mins}m` : `Every ${hours}h`;
    }
  };

  const renderScheduleCard = (schedule: AlarmSchedule) => {
    const interval = calculateInterval(schedule.startTime, schedule.endTime, schedule.numberOfAlarms);
    
    return (
      <Card key={schedule.id} style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <View style={styles.scheduleInfo}>
            <ThemedText style={[typography.body, styles.scheduleName]}>{schedule.name}</ThemedText>
            <ThemedText style={[typography.caption, { color: theme.textSecondary }]}>
              {schedule.numberOfAlarms} alarms {interval.toLowerCase()}
            </ThemedText>
          </View>
            {schedule.recurrenceEnabled ? (
              <ThemedText style={[typography.caption, { color: theme.textSecondary }]}>
                Repeats every {schedule.recurrenceEvery || 1} {schedule.recurrenceUnit || "days"}
              </ThemedText>
            ) : null}
          <Switch
            value={schedule.enabled}
            onValueChange={() => handleToggleSchedule(schedule)}
            trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
            thumbColor={theme.surface}
          />
        </View>
        
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Feather name="sunrise" size={16} color={theme.textSecondary} />
            <ThemedText style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
              {formatTime(schedule.startTime)}
            </ThemedText>
          </View>
          <Feather name="arrow-right" size={14} color={theme.textSecondary} />
          <View style={styles.timeBlock}>
            <Feather name="sunset" size={16} color={theme.textSecondary} />
            <ThemedText style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
              {formatTime(schedule.endTime)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.scheduleActions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.backgroundTertiary }]}
            onPress={() => handleEditSchedule(schedule)}
          >
            <Feather name="edit-2" size={16} color={theme.primary} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: `${theme.error}20` }]}
            onPress={() => handleDeleteSchedule(schedule)}
          >
            <Feather name="trash-2" size={16} color={theme.error} />
          </Pressable>
        </View>
      </Card>
    );
  };

  const renderModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setEditingSchedule(null);
        } else {
          setShowAddModal(false);
        }
        resetForm();
      }}
    >
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={typography.h3}>
              {isEdit ? "Edit Alarm Schedule" : "New Alarm Schedule"}
            </ThemedText>
            <Pressable
              onPress={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setEditingSchedule(null);
                } else {
                  setShowAddModal(false);
                }
                resetForm();
              }}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <ThemedText style={[typography.caption, { color: theme.textSecondary, marginBottom: 8 }]}>
              Name
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.divider,
                },
                typography.body,
              ]}
              placeholder="e.g., Hydration reminders"
              placeholderTextColor={theme.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />

            <ThemedText style={[typography.caption, { color: theme.textSecondary, marginBottom: 8, marginTop: 16 }]}>
              Number of alarms
            </ThemedText>
            <View style={styles.sliderContainer}>
              <ThemedText style={[typography.h2, { color: theme.primary }]}>{newNumberOfAlarms}</ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={12}
                step={1}
                value={newNumberOfAlarms}
                onValueChange={setNewNumberOfAlarms}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.backgroundTertiary}
                thumbTintColor={theme.primary}
              />
            </View>

            <View style={styles.timePickerRow}>
              <View style={styles.timePickerBlock}>
                <ThemedText style={[typography.caption, { color: theme.textSecondary, marginBottom: 8 }]}>
                  Start time
                </ThemedText>
                <Pressable
                  style={[styles.timeButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Feather name="clock" size={16} color={theme.primary} />
                  <ThemedText style={[typography.body, { marginLeft: 8 }]}>{formatTime(newStartTime)}</ThemedText>
                </Pressable>
              </View>

              <View style={styles.timePickerBlock}>
                <ThemedText style={[typography.caption, { color: theme.textSecondary, marginBottom: 8 }]}>
                  End time
                </ThemedText>
                <Pressable
                  style={[styles.timeButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider }]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Feather name="clock" size={16} color={theme.primary} />
                  <ThemedText style={[typography.body, { marginLeft: 8 }]}>{formatTime(newEndTime)}</ThemedText>
                </Pressable>
              </View>
            </View>

            {(showStartPicker || showEndPicker) && (
              <DateTimePicker
                value={showStartPicker ? newStartTime : newEndTime}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (Platform.OS === "android") {
                    setShowStartPicker(false);
                    setShowEndPicker(false);
                  }
                  if (date) {
                    if (showStartPicker) {
                      setNewStartTime(date);
                    } else {
                      setNewEndTime(date);
                    }
                  }
                  if (Platform.OS === "ios") {
                    if (showStartPicker) setShowStartPicker(false);
                    if (showEndPicker) setShowEndPicker(false);
                  }
                }}
              />
            )}

            <ThemedText style={[typography.caption, { color: theme.textSecondary, marginTop: 16 }]}>
              Calculated interval: {calculateInterval(newStartTime, newEndTime, newNumberOfAlarms)}
            </ThemedText>


            <View style={[styles.optionRow, { marginTop: 20 }]}
            >
              <View style={styles.optionInfo}>
                <Feather name="repeat" size={18} color={theme.textSecondary} />
                <ThemedText style={[typography.body, { marginLeft: 12 }]}>Repeat</ThemedText>
              </View>
              <Switch
                value={newRecurrenceEnabled}
                onValueChange={setNewRecurrenceEnabled}
                trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>

            {newRecurrenceEnabled ? (
              <View style={{ marginTop: Spacing.md }}>
                <View style={styles.recurrenceRow}>
                  <ThemedText style={[typography.caption, { color: theme.textSecondary }]}>Every</ThemedText>
                  <TextInput
                    style={[styles.recurrenceInput, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.divider }]}
                    keyboardType="number-pad"
                    value={newRecurrenceEvery}
                    onChangeText={setNewRecurrenceEvery}
                  />
                  <Pressable
                    onPress={() => setNewRecurrenceUnit(newRecurrenceUnit === "days" ? "weeks" : "days")}
                    style={[styles.recurrenceUnitButton, { backgroundColor: theme.surfaceVariant }]}
                  >
                    <ThemedText style={typography.caption}>{newRecurrenceUnit}</ThemedText>
                  </Pressable>
                </View>

                <View style={[styles.optionRow, { marginTop: Spacing.sm }]}>
                  <View style={styles.optionInfo}>
                    <Feather name="calendar" size={18} color={theme.textSecondary} />
                    <ThemedText style={[typography.body, { marginLeft: 12 }]}>End date</ThemedText>
                  </View>
                  <Switch
                    value={newRecurrenceHasEndDate}
                    onValueChange={setNewRecurrenceHasEndDate}
                    trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
                    thumbColor={theme.surface}
                  />
                </View>

                {newRecurrenceHasEndDate ? (
                  <Pressable
                    onPress={() => setShowRecurrenceEndPicker(true)}
                    style={[styles.timeButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.divider, marginTop: Spacing.sm }]}
                  >
                    <Feather name="calendar" size={16} color={theme.primary} />
                    <ThemedText style={[typography.body, { marginLeft: 8 }]}>
                      {newRecurrenceEndDate.toLocaleDateString()}
                    </ThemedText>
                  </Pressable>
                ) : null}

                {showRecurrenceEndPicker ? (
                  <DateTimePicker
                    value={newRecurrenceEndDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      setShowRecurrenceEndPicker(false);
                      if (date) setNewRecurrenceEndDate(date);
                    }}
                  />
                ) : null}
              </View>
            ) : null}
            <View style={[styles.optionRow, { marginTop: 20 }]}>
              <View style={styles.optionInfo}>
                <Feather name="smartphone" size={18} color={theme.textSecondary} />
                <ThemedText style={[typography.body, { marginLeft: 12 }]}>Vibrate</ThemedText>
              </View>
              <Switch
                value={newVibrate}
                onValueChange={setNewVibrate}
                trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>
          </ScrollView>

          <Pressable
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={isEdit ? handleSaveEdit : handleAddSchedule}
          >
            <ThemedText style={[typography.body, { color: "#FFFFFF", fontWeight: "600" }]}>
              {isEdit ? "Save Changes" : "Create Schedule"}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather name="bell" size={20} color={theme.primary} />
          <ThemedText style={[typography.h3, { marginLeft: 8 }]}>Automated Alarms</ThemedText>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!hasPermission && Platform.OS !== "web") {
              requestPermission();
            }
            setShowAddModal(true);
          }}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {!hasPermission && Platform.OS !== "web" && (
        <Pressable
          style={[styles.permissionBanner, { backgroundColor: `${theme.accent}20` }]}
          onPress={requestPermission}
        >
          <Feather name="bell-off" size={16} color={theme.accent} />
          <ThemedText style={[typography.caption, { color: theme.accent, marginLeft: 8, flex: 1 }]}>
            Tap to enable notifications for alarms
          </ThemedText>
          <Feather name="chevron-right" size={16} color={theme.accent} />
        </Pressable>
      )}

      {Platform.OS === "web" && (
        <View style={[styles.permissionBanner, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText style={[typography.caption, { color: theme.textSecondary, marginLeft: 8, flex: 1 }]}>
            For full alarm support, use Expo Go on your phone
          </ThemedText>
        </View>
      )}

      {alarmSchedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="bell" size={32} color={theme.textSecondary} />
          <ThemedText style={[typography.body, { color: theme.textSecondary, marginTop: 12, textAlign: "center" }]}>
            No alarm schedules yet
          </ThemedText>
          <ThemedText style={[typography.caption, { color: theme.textSecondary, marginTop: 4, textAlign: "center", opacity: 0.7 }]}>
            Create one to get reminded at regular intervals
          </ThemedText>
        </View>
      ) : (
        <View style={styles.schedulesList}>
          {alarmSchedules.map(renderScheduleCard)}
        </View>
      )}

      {renderModal(false)}
      {renderModal(true)}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  schedulesList: {
    gap: 12,
  },
  scheduleCard: {
    padding: 12,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalBody: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  sliderContainer: {
    alignItems: "center",
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: 8,
  },
  timePickerRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  timePickerBlock: {
    flex: 1,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
});
