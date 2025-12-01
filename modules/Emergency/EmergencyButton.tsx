import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as Battery from "expo-battery";
import * as SMS from "expo-sms";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData, EmergencyContact } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function EmergencyButtonCard() {
  const { theme, typography } = useTheme();
  const {
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    emergencyMessage,
    setEmergencyMessage,
  } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");
  const [customMessage, setCustomMessage] = useState(emergencyMessage);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setCustomMessage(emergencyMessage);
  }, [emergencyMessage]);

  const handleEmergencyPress = () => {
    if (emergencyContacts.length === 0) {
      Alert.alert(
        "No Contacts Set",
        "Would you like to add emergency contacts first?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Contacts", onPress: () => setShowSettings(true) },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowConfirm(true);
  };

  const handleSendEmergency = async () => {
    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      let locationText = "Location unavailable";
      let batteryText = "Battery info unavailable";

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          locationText = `https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
        } else {
          locationText = "Location permission not granted";
        }
      } catch (e) {
        console.log("Location error:", e);
        locationText = "Could not get location";
      }

      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        if (batteryLevel >= 0) {
          batteryText = `${Math.round(batteryLevel * 100)}%`;
        }
      } catch (e) {
        console.log("Battery error:", e);
      }

      const fullMessage = `${emergencyMessage}\n\nLocation: ${locationText}\nBattery: ${batteryText}\n\nSent from SpikeyProfile`;

      if (Platform.OS === "web") {
        Alert.alert(
          "Web Platform",
          "SMS is not available on web. To use this feature, please open the app in Expo Go on your phone.",
          [{ text: "OK" }]
        );
        setIsSending(false);
        setShowConfirm(false);
        return;
      }

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const phoneNumbers = emergencyContacts.map((c) => c.phone);
        await SMS.sendSMSAsync(phoneNumbers, fullMessage);
        
        Alert.alert(
          "Message Prepared",
          "Your emergency message has been prepared. Please send it from your messaging app.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "SMS Not Available",
          "SMS is not available on this device. If you need help, please call your emergency contacts directly.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Emergency send error:", error);
      Alert.alert(
        "Something went wrong",
        "We couldn't prepare the message. If you need immediate help, please call your emergency contacts directly.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSending(false);
      setShowConfirm(false);
    }
  };

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      addEmergencyContact({
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        relationship: newContactRelation.trim() || "Contact",
      });
      setNewContactName("");
      setNewContactPhone("");
      setNewContactRelation("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveMessage = () => {
    setEmergencyMessage(customMessage);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <>
      <Card elevation={1}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: theme.error + "20" }]}>
              <Feather name="alert-circle" size={18} color={theme.error} />
            </View>
            <View>
              <ThemedText type="h4">Emergency</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {emergencyContacts.length} contacts set
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={({ pressed }) => [
              styles.settingsButton,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="settings" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleEmergencyPress}
          style={({ pressed }) => [
            styles.emergencyButton,
            { 
              backgroundColor: theme.error,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Feather name="phone-call" size={24} color="#FFFFFF" />
          <ThemedText type="body" style={styles.emergencyButtonText}>
            Need Help?
          </ThemedText>
        </Pressable>

        <ThemedText type="caption" style={[styles.disclaimer, { color: theme.textSecondary }]}>
          Tap to alert your emergency contacts
        </ThemedText>
      </Card>

      <Modal
        visible={showConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <ThemedView style={[styles.confirmContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.confirmIcon, { backgroundColor: theme.error + "20" }]}>
              <Feather name="alert-triangle" size={32} color={theme.error} />
            </View>
            <ThemedText type="h3" style={styles.confirmTitle}>
              Send Emergency Alert?
            </ThemedText>
            <ThemedText type="body" style={[styles.confirmMessage, { color: theme.textSecondary }]}>
              This will send your message with your location and battery info to {emergencyContacts.length} contact(s).
            </ThemedText>

            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => setShowConfirm(false)}
                style={[styles.cancelButton, { backgroundColor: theme.surfaceVariant }]}
                disabled={isSending}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleSendEmergency}
                style={[styles.sendButton, { backgroundColor: theme.error }]}
                disabled={isSending}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {isSending ? "Sending..." : "Send Alert"}
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Emergency Settings</ThemedText>
              <Pressable onPress={() => setShowSettings(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Emergency Message
            </ThemedText>
            <TextInput
              style={[
                styles.messageInput,
                { 
                  backgroundColor: theme.surfaceVariant, 
                  color: theme.text,
                  fontSize: typography.body.fontSize,
                },
              ]}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Your emergency message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
            <Pressable
              onPress={handleSaveMessage}
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="small" style={{ color: "#FFFFFF" }}>
                Save Message
              </ThemedText>
            </Pressable>

            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.xl }]}>
              Emergency Contacts
            </ThemedText>

            {emergencyContacts.map((contact) => (
              <View key={contact.id} style={[styles.contactItem, { borderBottomColor: theme.divider }]}>
                <View>
                  <ThemedText type="body">{contact.name}</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {contact.relationship} - {contact.phone}
                  </ThemedText>
                </View>
                <Pressable onPress={() => removeEmergencyContact(contact.id)}>
                  <Feather name="trash-2" size={18} color={theme.error} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addContactForm}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                value={newContactName}
                onChangeText={setNewContactName}
                placeholder="Name"
                placeholderTextColor={theme.textSecondary}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                placeholder="Phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                value={newContactRelation}
                onChangeText={setNewContactRelation}
                placeholder="Relationship (optional)"
                placeholderTextColor={theme.textSecondary}
              />
              <Pressable
                onPress={handleAddContact}
                style={[styles.addButton, { backgroundColor: theme.primary }]}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Add Contact
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  emergencyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disclaimer: {
    textAlign: "center",
    marginTop: Spacing.md,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  confirmContent: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  confirmTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  confirmMessage: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  sendButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
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
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  messageInput: {
    height: 80,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  addContactForm: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
});
