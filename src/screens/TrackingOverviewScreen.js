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

const STATUS_LABEL = {
  OPEN_FOR_QUOTES: "Posted",
  CONFIRMED: "Driver Assigned",
  ACCEPTED: "Pickup Pending",
  IN_PROGRESS: "In Transit",
  DELIVERED: "Delivered",
};

const STATUS_COLOR = {
  OPEN_FOR_QUOTES: colors.statusPending,
  CONFIRMED: colors.statusActive,
  ACCEPTED: colors.statusActive,
  IN_PROGRESS: colors.success,
  DELIVERED: colors.textMuted,
};

export default function TrackingOverviewScreen() {
  const navigation = useNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActive();
    }, [])
  );

  const fetchActive = async () => {
    try {
      const data = await bookingService.getMyBookings();
      // Only shipments a shipper would actually want to track live.
      setBookings(data.filter((b) => b.status !== "DELIVERED" && b.status !== "OPEN_FOR_QUOTES"));
    } catch (error) {
      console.error("Failed to fetch active shipments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActive();
  };

  const driverNameOf = (b) => {
    const u = b.driverId?.userId;
    return u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Assigned" : "Unassigned";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("Tracking", { bookingId: item._id })}
    >
      <View style={styles.cardTop}>
        <AppText weight="semiBold" style={styles.loadId}>#{item._id?.slice(-6).toUpperCase()}</AppText>
        <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[item.status] || colors.statusNeutral}1A` }]}>
          <AppText weight="semiBold" style={[styles.statusPillText, { color: STATUS_COLOR[item.status] || colors.statusNeutral }]}>
            {STATUS_LABEL[item.status] || item.status}
          </AppText>
        </View>
      </View>

      <AppText weight="semiBold" style={styles.routeText} numberOfLines={1}>
        {item.pickupLocation?.address || "N/A"}  →  {item.deliveryLocation?.address || "N/A"}
      </AppText>

      <View style={styles.metaRow}>
        <AppText style={styles.metaText}>🚚 {driverNameOf(item)}</AppText>
        {item.deliveryDate && (
          <AppText style={styles.metaText}>
            Est. Delivery {new Date(item.deliveryDate).toLocaleDateString()}
          </AppText>
        )}
      </View>

      <View style={styles.trackRow}>
        <Feather name="map-pin" size={14} color={colors.primary} />
        <AppText weight="semiBold" style={styles.trackText}>Track this shipment</AppText>
        <Feather name="chevron-right" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="map" size={48} color={colors.textMuted} />
          <AppText weight="bold" style={styles.emptyTitle}>Nothing to track right now</AppText>
          <AppText style={styles.emptyText}>
            Once a driver is assigned to a load, you'll be able to track it live here.
          </AppText>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
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
    marginBottom: spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
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
});
