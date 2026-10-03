import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { showAlert } from "../utils/alert";
import chatService from "../services/chat.service";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

const timeAgo = (value) => {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

const initialsOf = (name) => (name || "?").trim().charAt(0).toUpperCase();

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      showAlert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.tripId)}
          contentContainerStyle={{ padding: spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={48} color={colors.textMuted} />
              <AppText weight="bold" style={styles.emptyTitle}>No messages yet</AppText>
              <AppText style={styles.emptyText}>
                Once a driver is assigned to your load, you can chat with them here.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("Chat", { tripId: item.tripId, recipientName: item.otherPartyName })}
            >
              <View style={styles.avatar}>
                <AppText weight="bold" style={styles.avatarText}>{initialsOf(item.otherPartyName)}</AppText>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={styles.rowTop}>
                  <AppText weight="semiBold" numberOfLines={1} style={{ flex: 1 }}>
                    {item.otherPartyName}
                  </AppText>
                  <AppText style={styles.time}>{timeAgo(item.lastMessageAt)}</AppText>
                </View>
                <AppText style={styles.loadNumber}>Load {item.loadNumber}</AppText>
                <AppText
                  numberOfLines={1}
                  style={[styles.preview, item.unreadCount > 0 && styles.previewUnread]}
                >
                  {item.lastMessage}
                </AppText>
              </View>
              {item.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <AppText weight="bold" style={styles.unreadBadgeText}>
                    {item.unreadCount > 9 ? "9+" : item.unreadCount}
                  </AppText>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    color: colors.text,
    marginTop: spacing.base,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 16,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  loadNumber: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  preview: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewUnread: {
    color: colors.text,
    fontWeight: "600",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: spacing.sm,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 11,
  },
});
