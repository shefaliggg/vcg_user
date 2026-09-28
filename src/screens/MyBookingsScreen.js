import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import bookingService from "../services/booking.service";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

const STATUS_ICON = {
  ACCEPTED: "check-circle",
  PENDING: "clock",
  CONFIRMED: "check-circle",
  COMPLETED: "check-circle",
  CANCELLED: "x-circle",
};

const STATUS_COLOR = {
  ACCEPTED: colors.statusSuccess,
  PENDING: colors.statusPending,
  CONFIRMED: colors.statusActive,
  COMPLETED: colors.statusCompleted,
  CANCELLED: colors.statusCancelled,
};

export default function MyBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings();
      const now = new Date();

      const filtered = data.filter((booking) => {
        if (booking.status !== "COMPLETED") return true;

        const completedDate = new Date(booking.updatedAt || booking.pickupDate);
        const diffInDays =
          (now - completedDate) / (1000 * 60 * 60 * 24);

        return diffInDays <= 7; // keep only 7 days
      });

      setBookings(filtered);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBookings();
  };

  // const getStatusColor = (status) => {
  //   const colors = {
  //     pending: "#fbbf24",
  //     confirmed: "#3b82f6",
  //     assigned: "#8b5cf6",
  //     in_progress: "#10b981",
  //     completed: "#059669",
  //     cancelled: "#ef4444",
  //   };
  //   return colors[status] || "#6b7280";
  // };

  // const getStatusLabel = (status) => {
  //   const labels = {
  //     pending: "Pending",
  //     confirmed: "Confirmed",
  //     assigned: "Assigned",
  //     in_progress: "In Progress",
  //     completed: "Completed",
  //     cancelled: "Cancelled",
  //   };
  //   return labels[status] || status;
  // };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate("Tracking", { bookingId: item._id })}
      >
        {/* Header */}
        <View style={styles.bookingHeader}>
          <AppText weight="semiBold" style={styles.bookingId}>
            #{item._id?.slice(-8).toUpperCase()}
          </AppText>

          <View
            style={[
              styles.statusBadge,
              item.status === "ACCEPTED" && styles.statusAccepted,
              item.status === "PENDING" && styles.statusPending,
              item.status === "CONFIRMED" && styles.statusConfirmed,
              item.status === "COMPLETED" && styles.statusCompleted,
              item.status === "CANCELLED" && styles.statusCancelled,
            ]}
          >
            <Feather
              name={STATUS_ICON[item.status] || "info"}
              size={11}
              color={STATUS_COLOR[item.status] || colors.statusNeutral}
            />
            <AppText
              weight="semiBold"
              style={[
                styles.statusBadgeText,
                { color: STATUS_COLOR[item.status] || colors.statusNeutral },
              ]}
            >
              {item.status.replace(/_/g, " ")}
            </AppText>
          </View>
        </View>

        {/* Route Section */}
        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={colors.textMuted} />
            <View style={styles.locationInfo}>
              <AppText weight="semiBold" style={styles.locationLabel}>Pickup</AppText>
              <AppText style={styles.locationText} numberOfLines={1}>
                {item.pickupLocation?.address || "N/A"}
              </AppText>
            </View>
          </View>

          <View style={styles.separatorLine} />

          <View style={styles.locationRow}>
            <Feather name="navigation" size={16} color={colors.textMuted} />
            <View style={styles.locationInfo}>
              <AppText weight="semiBold" style={styles.locationLabel}>Delivery</AppText>
              <AppText style={styles.locationText} numberOfLines={1}>
                {item.deliveryLocation?.address || "N/A"}
              </AppText>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <AppText weight="semiBold" style={styles.detailLabel}>Truck</AppText>
            <AppText style={styles.detailValue}>{item.truckType}</AppText>
          </View>

          <View style={styles.detailItem}>
            <AppText weight="semiBold" style={styles.detailLabel}>Weight</AppText>
            <AppText style={styles.detailValue}>
              {item.loadDetails?.weight || 0} kg
            </AppText>
          </View>

          <View style={styles.detailItem}>
            <AppText weight="semiBold" style={styles.detailLabel}>Pickup Date</AppText>
            <AppText style={styles.detailValue}>
              {new Date(item.pickupDate).toLocaleDateString()}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewQuotesBtn}
          onPress={() =>
            navigation.navigate("BookingQuotes", { bookingId: item._id })
          }
        >
          <AppText weight="semiBold" style={styles.viewQuotesBtnText}>View Quotes</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() =>
            navigation.navigate("Tracking", { bookingId: item._id })
          }
        >
          <AppText weight="semiBold" style={styles.trackBtnText}>Track</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText weight="semiBold" style={styles.loadingText}>Loading your bookings...</AppText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <AppText variant="screenTitle" style={styles.headerTitle}>My Bookings</AppText>

        <TouchableOpacity
          style={styles.newBookingBtn}
          onPress={() => navigation.navigate("Booking")}
        >
          <AppText weight="semiBold" style={styles.newBookingBtnText}>+ New</AppText>
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText weight="normal" style={styles.emptyIcon}>📦</AppText>
          <AppText weight="bold" style={styles.emptyTitle}>No bookings yet</AppText>
          <AppText weight="normal" style={styles.emptyText}>
            Create your first booking to get started
          </AppText>
          <TouchableOpacity
            style={styles.createBookingBtn}
            onPress={() => navigation.navigate("Booking")}
          >
            <AppText weight="semiBold" style={styles.createBookingBtnText}>Create Booking</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },

  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },

  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },

  arrowContainer: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  arrow: {
    fontSize: 16,
    color: "#9ca3af",
  },

  detailItem: {
    flex: 1,
  },


  driverInfo: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  driverLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },



  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  createBookingBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
  },
  createBookingBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerTitle: {
    color: colors.text,
  },

  newBookingBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },

  newBookingBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    marginBottom: spacing.base,
    marginTop: spacing.sm,
    margin: spacing.base,
    paddingVertical: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },

  bookingId: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  statusAccepted: {
    backgroundColor: "#DCFCE7",
  },

  statusPending: {
    backgroundColor: "#FEF3C7",
  },

  statusConfirmed: {
    backgroundColor: "#DBEAFE",
  },

  statusCompleted: {
    backgroundColor: "#E0F2FE",
  },

  statusCancelled: {
    backgroundColor: "#FEE2E2",
  },

  routeContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  separatorLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  locationLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },

  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },

  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
  },

  viewQuotesBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: "center",
  },

  viewQuotesBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },

  trackBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },

  trackBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
});
