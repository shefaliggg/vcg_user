import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import api from "../services/api.service";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

export default function NotificationScreen() {
  const navigation = useNavigation();
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <AppText weight="bold" style={styles.headerTitle}>
            Notifications
          </AppText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <AppText weight="bold" style={styles.headerTitle}>
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
            <TouchableOpacity
              style={styles.card}
              disabled={!item.data?.bookingId}
              onPress={() =>
                navigation.navigate("LoadDetails", {
                  bookingId: item.data.bookingId,
                })
              }
            >
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
            </TouchableOpacity>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backBtn: { width: 34 },

  headerTitle: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
  },

  content: {
    flex: 1,
    backgroundColor: colors.background,
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