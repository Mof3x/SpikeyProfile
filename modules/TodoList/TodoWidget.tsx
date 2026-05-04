import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { useLoggedFeedback } from "@/core/LoggedFeedbackContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export function TodoWidget() {
  const { theme, typography } = useTheme();
  const { todos, addTodo, toggleTodo, removeTodo, groupTodos, setGroupTodos } = useData();
  const { showLogged } = useLoggedFeedback();
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");

  const incompleteTodos = todos.filter((t) => !t.completed).slice(0, 5);
  const completedCount = todos.filter((t) => t.completed).length;
  // Group todos into sections: Overdue, Today, Upcoming, No Date
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const overdue = todos.filter(t => t.dueDate && new Date(t.dueDate) < startOfToday && !t.completed);
  const todayTodos = todos.filter(t => t.dueDate && new Date(t.dueDate) >= startOfToday && new Date(t.dueDate) < endOfToday && !t.completed);
  const upcoming = todos.filter(t => t.dueDate && new Date(t.dueDate) >= endOfToday && !t.completed);
  const noDate = todos.filter(t => !t.dueDate && !t.completed);

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
    const todo = todos.find(t => t.id === id);
    toggleTodo(id);
    
    // Show feedback when task is completed
    if (todo && !todo.completed) {
      showLogged(`✓ ${todo.text}`, "check-square");
    }
  };

  const handleRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeTodo(id);
  };

  const renderTodoItem = (todo: any) => (
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
  );

  return (
    <Card elevation={1}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="check-square" size={18} color={theme.primary} />
          </View>
          <ThemedText type="h4">To-Do</ThemedText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Sections</ThemedText>
          <Switch
            value={groupTodos}
            onValueChange={setGroupTodos}
            trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
            thumbColor={theme.surface}
          />
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

      {todos.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Nothing here yet. Ready to add something?
          </ThemedText>
        </View>
      ) : (
        <View style={styles.todoList}>
          {groupTodos ? (
            <>
              {overdue.length > 0 && (
                <>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>Overdue</ThemedText>
                  {overdue.map(todo => renderTodoItem(todo))}
                </>
              )}

              {todayTodos.length > 0 && (
                <>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>Today</ThemedText>
                  {todayTodos.map(todo => renderTodoItem(todo))}
                </>
              )}

              {upcoming.length > 0 && (
                <>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>Upcoming</ThemedText>
                  {upcoming.map(todo => renderTodoItem(todo))}
                </>
              )}

              {noDate.length > 0 && (
                <>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>No date</ThemedText>
                  {noDate.map(todo => renderTodoItem(todo))}
                </>
              )}
            </>
          ) : (
            incompleteTodos.map(todo => renderTodoItem(todo))
          )}
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
