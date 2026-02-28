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

          <AppText weight="semiBold"
            style={[
              styles.statusBadge,
              item.status === "ACCEPTED" && styles.statusAccepted,
              item.status === "PENDING" && styles.statusPending,
              item.status === "CONFIRMED" && styles.statusConfirmed,
              item.status === "COMPLETED" && styles.statusCompleted,
              item.status === "CANCELLED" && styles.statusCancelled,
            ]}
          >
            {item.status.replace(/_/g, " ")}
          </AppText>
        </View>

        {/* Route Section */}
        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color="#6B7280" />
            <View style={styles.locationInfo}>
              <AppText weight="semiBold" style={styles.locationLabel}>Pickup</AppText>
              <AppText style={styles.locationText} numberOfLines={1}>
                {item.pickupLocation?.address || "N/A"}
              </AppText>
            </View>
          </View>

          <View style={styles.separatorLine} />

          <View style={styles.locationRow}>
            <Feather name="navigation" size={16} color="#6B7280" />
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
        <ActivityIndicator size="large" color="#1E3A8A" />
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
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>

        <AppText weight="bold" style={styles.headerTitle}>My Bookings</AppText>

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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },






  statusText: {
    color: "#fff",
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  createBookingBtn: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBookingBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  newBookingBtn: {
    backgroundColor: "#1E3A8A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },

  newBookingBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 10,
    margin: 18,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },

  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  bookingId: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "600",
  },

  statusAccepted: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  statusPending: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },

  statusConfirmed: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
  },

  statusCompleted: {
    backgroundColor: "#E0F2FE",
    color: "#075985",
  },

  statusCancelled: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },

  routeContainer: {
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  separatorLine: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },

  locationLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
  },

  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },

  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  viewQuotesBtn: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  viewQuotesBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  trackBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A8A",
  },

  trackBtnText: {
    color: "#1E3A8A",
    fontSize: 13,
    fontWeight: "600",
  },
});
