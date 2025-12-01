import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export function NotesCard() {
  const { theme, typography } = useTheme();
  const [notes, setNotes] = useState<Array<{ id: string; text: string; timestamp: Date }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotes((prev) => [
      { id: Date.now().toString(), text: newNoteText.trim(), timestamp: new Date() },
      ...prev,
    ]);
    setNewNoteText("");
  };

  const handleDeleteNote = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleStartRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    if (Platform.OS !== "web") {
      setNewNoteText((prev) => prev + " [Audio placeholder]");
    }
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + "20" }]}>
              <Feather name="edit-3" size={18} color={theme.accent} />
            </View>
            <ThemedText type="h3">Notes & Thoughts</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(true);
            }}
            style={[styles.addButton, { backgroundColor: theme.accent }]}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
              No notes yet. Tap + to add your thoughts!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.notesList}>
            {notes.slice(0, 3).map((note) => (
              <View key={note.id} style={[styles.noteItem, { backgroundColor: theme.surfaceVariant }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="body" numberOfLines={2} style={{ fontWeight: "500" }}>
                    {note.text}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary, marginTop: Spacing.xs }}
                  >
                    {note.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                </View>
                <Pressable onPress={() => handleDeleteNote(note.id)} hitSlop={8}>
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            ))}
            {notes.length > 3 && (
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}
              >
                +{notes.length - 3} more notes
              </ThemedText>
            )}
          </View>
        )}
      </Card>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Add Note</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={[
                  styles.noteInput,
                  { backgroundColor: theme.surfaceVariant, color: theme.text, fontSize: typography.body.fontSize },
                ]}
                value={newNoteText}
                onChangeText={setNewNoteText}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.textSecondary}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.recordingSection}>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                  Audio Transcription (Placeholder)
                </ThemedText>
                <Pressable
                  onPress={isRecording ? handleStopRecording : handleStartRecording}
                  style={[
                    styles.recordButton,
                    { backgroundColor: isRecording ? theme.error : theme.primary },
                  ]}
                >
                  <Feather
                    name={isRecording ? "square" : "mic"}
                    size={20}
                    color="#FFFFFF"
                  />
                  <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                onPress={handleAddNote}
                style={[styles.saveButton, { backgroundColor: theme.accent, opacity: newNoteText.trim() ? 1 : 0.5 }]}
                disabled={!newNoteText.trim()}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  Save Note
                </ThemedText>
              </Pressable>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    paddingVertical: Spacing.xl,
  },
  notesList: {
    gap: Spacing.sm,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    marginBottom: Spacing.lg,
  },
  noteInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 120,
    marginBottom: Spacing.lg,
  },
  recordingSection: {
    marginBottom: Spacing.lg,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
});
