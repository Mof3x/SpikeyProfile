import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function TodoWidget() {
  const { theme, typography } = useTheme();
  const { todos, addTodo, toggleTodo, removeTodo } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");

  const incompleteTodos = todos.filter((t) => !t.completed).slice(0, 5);
  const completedCount = todos.filter((t) => t.completed).length;

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim());
      setNewTodoText("");
      setIsAdding(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleToggle = (id: string) => {
    Haptics.selectionAsync();
    toggleTodo(id);
  };

  const handleRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeTodo(id);
  };

  return (
    <Card elevation={1}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="check-square" size={18} color={theme.primary} />
          </View>
          <ThemedText type="h4">To-Do</ThemedText>
        </View>
        <Pressable
          onPress={() => setIsAdding(!isAdding)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name={isAdding ? "x" : "plus"} size={18} color={theme.primary} />
        </Pressable>
      </View>

      {isAdding ? (
        <View style={styles.addContainer}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.surfaceVariant, 
                color: theme.text,
                fontSize: typography.body.fontSize,
              },
            ]}
            value={newTodoText}
            onChangeText={setNewTodoText}
            placeholder="What would you like to do?"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            onSubmitEditing={handleAddTodo}
          />
          <Pressable
            onPress={handleAddTodo}
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
          >
            <Feather name="check" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      {incompleteTodos.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Nothing here yet. Ready to add something?
          </ThemedText>
        </View>
      ) : (
        <View style={styles.todoList}>
          {incompleteTodos.map((todo) => (
            <View key={todo.id} style={styles.todoItem}>
              <Pressable
                onPress={() => handleToggle(todo.id)}
                style={[
                  styles.checkbox,
                  { borderColor: theme.primary },
                ]}
              >
                {todo.completed ? (
                  <Feather name="check" size={14} color={theme.primary} />
                ) : null}
              </Pressable>
              <ThemedText
                type="body"
                style={[
                  styles.todoText,
                  todo.completed && { textDecorationLine: "line-through", opacity: 0.5 },
                ]}
                numberOfLines={1}
              >
                {todo.text}
              </ThemedText>
              <Pressable
                onPress={() => handleRemove(todo.id)}
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
              >
                <Feather name="x" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {completedCount > 0 ? (
        <View style={[styles.footer, { borderTopColor: theme.divider }]}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {completedCount} completed
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  addContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  todoList: {
    gap: Spacing.sm,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  todoText: {
    flex: 1,
  },
  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
});
