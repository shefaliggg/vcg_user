import React, { useState, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import bookingService from "../services/booking.service";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";
import { getLoadStage } from "../utils/loadStatus";

export default function LoadsScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchLoads();
    }, [])
  );

  const fetchLoads = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (error) {
      console.error("Failed to fetch loads:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoads();
  };

  const driverNameOf = (b) => {
    const u = b.driverId?.userId;
    return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Assigned" : "Unassigned";
  };

  const renderItem = ({ item }) => {
    const stage = getLoadStage(item);
    return (
      <TouchableOpacity
        style={[styles.card, stage.needsAction && { borderColor: stage.color }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("LoadDetails", { bookingId: item._id })}
      >
        <View style={styles.cardTop}>
          <AppText weight="semiBold" style={styles.loadId}>#{item._id?.slice(-6).toUpperCase()}</AppText>
          <View style={[styles.statusPill, { backgroundColor: `${stage.color}1A` }]}>
            <AppText weight="semiBold" style={[styles.statusPillText, { color: stage.color }]}>
              {stage.label}
            </AppText>
          </View>
        </View>

        <AppText weight="semiBold" style={styles.routeText} numberOfLines={1}>
          {item.pickupLocation?.address || "N/A"}  →  {item.deliveryLocation?.address || "N/A"}
        </AppText>

        <View style={styles.metaRow}>
          <AppText style={styles.metaText}>
            📅 {item.pickupDate ? new Date(item.pickupDate).toLocaleDateString() : "TBD"}
            {item.deliveryDate ? ` → ${new Date(item.deliveryDate).toLocaleDateString()}` : ""}
          </AppText>
          <AppText style={styles.metaText}>🚚 {driverNameOf(item)}</AppText>
        </View>

        <View style={styles.viewRow}>
          <AppText weight="semiBold" style={[styles.viewText, { color: stage.needsAction ? stage.color : colors.primary }]}>
            {stage.needsAction ? "Review & Act" : "View Load"}
          </AppText>
          <Feather name="chevron-right" size={16} color={stage.needsAction ? stage.color : colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="package" size={48} color={colors.textMuted} />
          <AppText weight="bold" style={styles.emptyTitle}>No loads yet</AppText>
          <AppText style={styles.emptyText}>Tap Post Load at the top to add your first load</AppText>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
  },
  postLoadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  postLoadText: {
    color: colors.white,
    fontSize: 13,
  },
  listContainer: {
    padding: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  loadId: {
    fontSize: 13,
    color: colors.textMuted,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
  },
  routeText: {
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  viewText: {
    fontSize: 13,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
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
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
  },
  emptyButtonText: {
    color: colors.white,
  },
});
