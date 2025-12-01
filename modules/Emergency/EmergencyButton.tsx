import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, Alert, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as Battery from "expo-battery";
import * as SMS from "expo-sms";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData, EmergencyContact, CrisisScript, MedicalInfo } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

function ModalScrollWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return (
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    );
  }
  return (
    <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </KeyboardAwareScrollView>
  );
}

export function EmergencyButtonCard() {
  const { theme, typography } = useTheme();
  const {
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    emergencyMessage,
    setEmergencyMessage,
    medicalInfo,
    setMedicalInfo,
    crisisScripts,
    updateCrisisScript,
    addCrisisScript,
    removeCrisisScript,
  } = useData();
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMedicalCard, setShowMedicalCard] = useState(false);
  const [showCrisisScripts, setShowCrisisScripts] = useState(false);
  const [showAddScript, setShowAddScript] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRelation, setNewContactRelation] = useState("");
  const [customMessage, setCustomMessage] = useState(emergencyMessage);
  const [isSending, setIsSending] = useState(false);
  const [editingMedical, setEditingMedical] = useState<MedicalInfo>(medicalInfo);
  const [newScriptTitle, setNewScriptTitle] = useState("");
  const [newScriptContent, setNewScriptContent] = useState("");
  const [selectedScript, setSelectedScript] = useState<CrisisScript | null>(null);

  useEffect(() => {
    setCustomMessage(emergencyMessage);
  }, [emergencyMessage]);

  useEffect(() => {
    setEditingMedical(medicalInfo);
  }, [medicalInfo]);

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

  const handleSaveMedicalInfo = () => {
    setMedicalInfo(editingMedical);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowMedicalCard(false);
  };

  const addItemToMedical = (field: "allergies" | "medications" | "diagnoses", value: string) => {
    if (value.trim()) {
      setEditingMedical(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeItemFromMedical = (field: "allergies" | "medications" | "diagnoses", index: number) => {
    setEditingMedical(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleAddScript = () => {
    if (newScriptTitle.trim() && newScriptContent.trim()) {
      addCrisisScript({
        title: newScriptTitle.trim(),
        content: newScriptContent.trim(),
        category: "custom",
        enabled: true,
      });
      setNewScriptTitle("");
      setNewScriptContent("");
      setShowAddScript(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getCategoryIcon = (category: CrisisScript["category"]) => {
    switch (category) {
      case "sensory": return "volume-x";
      case "anxiety": return "heart";
      case "meltdown": return "zap";
      case "medical": return "activity";
      default: return "file-text";
    }
  };

  const getCategoryColor = (category: CrisisScript["category"]) => {
    switch (category) {
      case "sensory": return theme.primary;
      case "anxiety": return "#E91E63";
      case "meltdown": return "#FF9800";
      case "medical": return theme.error;
      default: return theme.textSecondary;
    }
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

        <View style={styles.quickActions}>
          <Pressable
            onPress={() => setShowMedicalCard(true)}
            style={({ pressed }) => [
              styles.quickAction,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="clipboard" size={16} color={theme.primary} />
            <ThemedText type="caption" style={{ color: theme.text }}>Medical Info</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setShowCrisisScripts(true)}
            style={({ pressed }) => [
              styles.quickAction,
              { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="file-text" size={16} color={theme.primary} />
            <ThemedText type="caption" style={{ color: theme.text }}>Crisis Scripts</ThemedText>
          </Pressable>
        </View>

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
        visible={showMedicalCard}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMedicalCard(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Medical Information</ThemedText>
              <Pressable onPress={() => setShowMedicalCard(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ModalScrollWrapper>
              <MedicalSection
                title="Allergies"
                items={editingMedical.allergies}
                onAdd={(value) => addItemToMedical("allergies", value)}
                onRemove={(index) => removeItemFromMedical("allergies", index)}
                theme={theme}
                typography={typography}
                placeholder="Add allergy..."
              />

              <MedicalSection
                title="Medications"
                items={editingMedical.medications}
                onAdd={(value) => addItemToMedical("medications", value)}
                onRemove={(index) => removeItemFromMedical("medications", index)}
                theme={theme}
                typography={typography}
                placeholder="Add medication..."
              />

              <MedicalSection
                title="Diagnoses"
                items={editingMedical.diagnoses}
                onAdd={(value) => addItemToMedical("diagnoses", value)}
                onRemove={(index) => removeItemFromMedical("diagnoses", index)}
                theme={theme}
                typography={typography}
                placeholder="Add diagnosis..."
              />

              <View style={styles.fieldContainer}>
                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Blood Type
                </ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                  value={editingMedical.bloodType}
                  onChangeText={(text) => setEditingMedical(prev => ({ ...prev, bloodType: text }))}
                  placeholder="e.g., O+"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Additional Notes
                </ThemedText>
                <TextInput
                  style={[styles.messageInput, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
                  value={editingMedical.notes}
                  onChangeText={(text) => setEditingMedical(prev => ({ ...prev, notes: text }))}
                  placeholder="Any additional medical information..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Pressable
                onPress={handleSaveMedicalInfo}
                style={[styles.saveAllButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Save Medical Info
                </ThemedText>
              </Pressable>
            </ModalScrollWrapper>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showCrisisScripts}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCrisisScripts(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Crisis Scripts</ThemedText>
              <View style={styles.headerButtons}>
                <Pressable 
                  onPress={() => setShowAddScript(true)}
                  style={[styles.addScriptButton, { backgroundColor: theme.primary }]}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable onPress={() => setShowCrisisScripts(false)}>
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
              Pre-written scripts you can show when you need help communicating
            </ThemedText>

            <ScrollView showsVerticalScrollIndicator={false}>
              {crisisScripts.map((script) => (
                <Pressable
                  key={script.id}
                  onPress={() => setSelectedScript(script)}
                  style={({ pressed }) => [
                    styles.scriptItem,
                    { 
                      backgroundColor: script.enabled ? theme.surfaceVariant : theme.surface,
                      borderColor: theme.divider,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.scriptHeader}>
                    <View style={[styles.scriptIcon, { backgroundColor: getCategoryColor(script.category) + "20" }]}>
                      <Feather name={getCategoryIcon(script.category)} size={16} color={getCategoryColor(script.category)} />
                    </View>
                    <View style={styles.scriptInfo}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>{script.title}</ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                        {script.content}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={selectedScript !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedScript(null)}
      >
        <View style={styles.confirmOverlay}>
          <ThemedView style={[styles.scriptDisplayContent, { backgroundColor: theme.surface }]}>
            {selectedScript && (
              <>
                <View style={[styles.scriptDisplayIcon, { backgroundColor: getCategoryColor(selectedScript.category) + "20" }]}>
                  <Feather name={getCategoryIcon(selectedScript.category)} size={32} color={getCategoryColor(selectedScript.category)} />
                </View>
                <ThemedText type="h2" style={styles.scriptDisplayTitle}>
                  {selectedScript.title}
                </ThemedText>
                <ThemedText type="body" style={[styles.scriptDisplayText, { color: theme.text }]}>
                  {selectedScript.content}
                </ThemedText>
                <View style={styles.scriptActions}>
                  <Pressable
                    onPress={() => {
                      updateCrisisScript(selectedScript.id, { enabled: !selectedScript.enabled });
                      setSelectedScript(null);
                    }}
                    style={[styles.scriptActionButton, { backgroundColor: theme.surfaceVariant }]}
                  >
                    <Feather 
                      name={selectedScript.enabled ? "eye-off" : "eye"} 
                      size={18} 
                      color={theme.text} 
                    />
                    <ThemedText type="caption">{selectedScript.enabled ? "Hide" : "Show"}</ThemedText>
                  </Pressable>
                  {selectedScript.category === "custom" && (
                    <Pressable
                      onPress={() => {
                        removeCrisisScript(selectedScript.id);
                        setSelectedScript(null);
                      }}
                      style={[styles.scriptActionButton, { backgroundColor: theme.error + "20" }]}
                    >
                      <Feather name="trash-2" size={18} color={theme.error} />
                      <ThemedText type="caption" style={{ color: theme.error }}>Delete</ThemedText>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  onPress={() => setSelectedScript(null)}
                  style={[styles.closeScriptButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Close
                  </ThemedText>
                </Pressable>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>

      <Modal
        visible={showAddScript}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddScript(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.addScriptContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Add Crisis Script</ThemedText>
              <Pressable onPress={() => setShowAddScript(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              Script Title
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
              value={newScriptTitle}
              onChangeText={setNewScriptTitle}
              placeholder="e.g., Social Overwhelm"
              placeholderTextColor={theme.textSecondary}
            />

            <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
              Script Content
            </ThemedText>
            <TextInput
              style={[styles.scriptTextarea, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
              value={newScriptContent}
              onChangeText={setNewScriptContent}
              placeholder="Write what you want to communicate during a crisis..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
            />

            <Pressable
              onPress={handleAddScript}
              style={[styles.saveAllButton, { backgroundColor: theme.primary, opacity: (newScriptTitle && newScriptContent) ? 1 : 0.5 }]}
              disabled={!newScriptTitle || !newScriptContent}
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Add Script
              </ThemedText>
            </Pressable>
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

            <ModalScrollWrapper>
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
            </ModalScrollWrapper>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

interface MedicalSectionProps {
  title: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  theme: any;
  typography: any;
  placeholder: string;
}

function MedicalSection({ title, items, onAdd, onRemove, theme, typography, placeholder }: MedicalSectionProps) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem("");
    }
  };

  return (
    <View style={styles.medicalSection}>
      <ThemedText type="small" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        {title}
      </ThemedText>
      <View style={styles.tagContainer}>
        {items.map((item, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText type="caption" style={{ color: theme.primary }}>{item}</ThemedText>
            <Pressable onPress={() => onRemove(index)} hitSlop={8}>
              <Feather name="x" size={14} color={theme.primary} />
            </Pressable>
          </View>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.addInput, { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize }]}
          value={newItem}
          onChangeText={setNewItem}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          onSubmitEditing={handleAdd}
        />
        <Pressable
          onPress={handleAdd}
          style={[styles.addItemButton, { backgroundColor: theme.primary }]}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
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
  quickActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  addScriptButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
  medicalSection: {
    marginBottom: Spacing.xl,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  addInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  addItemButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  saveAllButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  scriptItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  scriptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  scriptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scriptInfo: {
    flex: 1,
  },
  scriptDisplayContent: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  scriptDisplayIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  scriptDisplayTitle: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  scriptDisplayText: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  scriptActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scriptActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  closeScriptButton: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  addScriptContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  scriptTextarea: {
    height: 150,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    textAlignVertical: "top",
  },
});
