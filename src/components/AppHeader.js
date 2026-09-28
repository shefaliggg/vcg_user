import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, DeviceEventEmitter } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authService from "../services/auth.service";
import api from "../services/api.service";
import AppText from "./AppText";
import ShipperDrawer from "./ShipperDrawer";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";

// Shipper tab header: [company avatar + name]   [page title]   [bell]
// Kept in step with the CP Driver AppHeader (same height, colors, spacing).
export default function AppHeader({ title }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.count);
    } catch (err) {
      console.log("Unread count error:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      authService.getCurrentUser().then(setUser).catch(() => {});
      fetchCount();
    }, [fetchCount])
  );

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener("refreshNotifications", fetchCount);
    return () => listener.remove();
  }, [fetchCount]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} accessibilityLabel="Open menu">
            <Feather name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <AppText weight="bold" style={styles.title} numberOfLines={1}>{title}</AppText>
        </View>

        <View style={styles.right}>
          <TouchableOpacity style={styles.postLoad} onPress={() => navigation.navigate("Booking")} accessibilityLabel="Post a load">
            <Feather name="plus" size={16} color={colors.white} />
            <AppText weight="semiBold" style={styles.postLoadText}>Post Load</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Messages")} accessibilityLabel="Messages">
            <Feather name="message-circle" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")} accessibilityLabel="Notifications">
            <Feather name="bell" size={22} color={colors.text} />
            {unread > 0 && (
              <View style={styles.badge}>
                <AppText weight="bold" style={styles.badgeText}>{unread > 99 ? "99+" : unread}</AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ShipperDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 13,
  },
  title: {
    flexShrink: 1,
    marginLeft: spacing.md,
    fontSize: 17,
    color: colors.text,
  },
  right: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.base,
  },
  postLoad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: 15,
    backgroundColor: colors.primary,
  },
  postLoadText: { color: colors.white, fontSize: 12 },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
  },
});
