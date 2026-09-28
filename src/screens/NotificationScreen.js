import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import api from "../services/api.service";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications/me");
      setNotifications(res.data);
    } catch (err) {
      console.log("Notification fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    api.put("/notifications/mark-read");
  }, []);

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.primary }]}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="screenTitle" style={styles.headerTitle}>
          Notifications
        </AppText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="bell" size={18} color={colors.primary} />
                <AppText variant="cardTitle" style={styles.title}>
                  {item.title}
                </AppText>
              </View>

              <AppText style={styles.body}>
                {item.body}
              </AppText>

              <AppText variant="caption" style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </AppText>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={40} color={colors.textMuted} />
              <AppText style={styles.emptyText}>
                No notifications yet
              </AppText>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: 70,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  headerTitle: {
    color: colors.white,
  },

  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    padding: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: radius.card,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  title: {
    color: colors.text,
  },

  body: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 6,
  },

  date: {
    color: colors.textMuted,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
});