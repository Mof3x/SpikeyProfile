import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

export function ClipboardPreview() {
  const { theme } = useTheme();
  const {
    clipboardItems,
    addClipboardItem,
    removeClipboardItem,
    updateClipboardItem,
  } = useData();
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleAddItem = () => {
    if (newItemText.trim()) {
      addClipboardItem(newItemText.trim());
      setNewItemText("");
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleEditItem = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      updateClipboardItem(editingId, editText.trim());
      setEditingId(null);
      setEditText("");
      Haptics.selectionAsync();
    }
  };

  const handleRemoveItem = (id: string) => {
    removeClipboardItem(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const emptySlots = Math.max(0, 3 - clipboardItems.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="clipboard" size={18} color={theme.primary} />
          <ThemedText type="h4" style={styles.title}>
            Clipboard Tray
          </ThemedText>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="plus" size={18} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.slots}>
        {clipboardItems.slice(0, 5).map((item) => (
          <View
            key={item.id}
            style={[styles.slot, { backgroundColor: theme.surfaceVariant }]}
          >
            {editingId === item.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, { color: theme.text }]}
                  value={editText}
                  onChangeText={setEditText}
                  autoFocus
                  onSubmitEditing={handleSaveEdit}
                />
                <Pressable onPress={handleSaveEdit}>
                  <Feather name="check" size={16} color={theme.success} />
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => handleEditItem(item.id, item.text)}
                  style={styles.slotContent}
                >
                  <ThemedText type="small" numberOfLines={1} style={styles.slotText}>
                    {item.text}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveItem(item.id)}
                  hitSlop={8}
                >
                  <Feather name="x" size={14} color={theme.textSecondary} />
                </Pressable>
              </>
            )}
          </View>
        ))}

        {Array.from({ length: emptySlots }).map((_, index) => (
          <Pressable
            key={`empty-${index}`}
            onPress={() => setModalVisible(true)}
            style={[
              styles.slot,
              styles.emptySlot,
              { borderColor: theme.divider },
            ]}
          >
            <ThemedText
              type="small"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Empty slot
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <ThemedView style={styles.modalContent}>
            <ThemedText type="h4" style={styles.modalTitle}>
              Add to Clipboard
            </ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.surfaceVariant, color: theme.text },
              ]}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Task or note..."
              placeholderTextColor={theme.textSecondary}
              autoFocus
              multiline
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: theme.surfaceVariant }]}
              >
                <ThemedText type="body">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                  Add
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.lg,
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
  title: {
    marginLeft: Spacing.xs,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  slots: {
    gap: Spacing.sm,
  },
  slot: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  slotContent: {
    flex: 1,
  },
  slotText: {
    fontWeight: "500",
  },
  emptySlot: {
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  emptyText: {
    opacity: 0.5,
    textAlign: "center",
  },
  editContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  editInput: {
    flex: 1,
    fontSize: Typography.small.fontSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
  },
  modalInput: {
    minHeight: 80,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    fontSize: Typography.body.fontSize,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
