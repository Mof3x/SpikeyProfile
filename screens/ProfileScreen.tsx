import React from "react";
import { StyleSheet, View, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import Spacer from "@/components/Spacer";
import { useTheme } from "@/hooks/useTheme";
import { useData } from "@/core/DataContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { userName, userStats, profileImageUri } = useData();

  const displayName = userName || "Your profile";

  const handleNavigate = (routeName: string) => {
    Haptics.selectionAsync();
    navigation.navigate(routeName);
  };

  return (
    <ScreenScrollView>
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={32} color="#FFFFFF" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="h3">{displayName}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Level {userStats.level} • {userStats.xp} XP
            </ThemedText>
          </View>
        </View>
      </Card>

      <Spacer height={Spacing.lg} />

      <Card>
        <ThemedText type="h4" style={styles.sectionTitle}>Always Accessible</ThemedText>

        <Pressable
          onPress={() => handleNavigate("InsightsTab")}
          style={({ pressed }) => [styles.linkRow, { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={styles.linkLeft}>
            <Feather name="bar-chart-2" size={18} color={theme.primary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>Graphs & Insights</ThemedText>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => handleNavigate("TrackTab")}
          style={({ pressed }) => [styles.linkRow, { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={styles.linkLeft}>
            <Feather name="list" size={18} color={theme.primary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>Logs & Results</ThemedText>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => handleNavigate("HomeTab")}
          style={({ pressed }) => [styles.linkRow, { backgroundColor: theme.surfaceVariant, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={styles.linkLeft}>
            <Feather name="activity" size={18} color={theme.primary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>Today Summary</ThemedText>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </Pressable>
      </Card>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    padding: Spacing.cardPadding,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  linkRow: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
});
