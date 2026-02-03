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
      setBookings(data);
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

  const getStatusColor = (status) => {
    const colors = {
      pending: "#fbbf24",
      confirmed: "#3b82f6",
      assigned: "#8b5cf6",
      in_progress: "#10b981",
      completed: "#059669",
      cancelled: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      assigned: "Assigned",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Tracking", { bookingId: item._id })}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingId} numberOfLines={1}>
            #{item._id?.slice(-8).toUpperCase()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickupLocation?.address || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>↓</Text>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📌</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Delivery</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.deliveryLocation?.address || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Truck Type</Text>
          <Text style={styles.detailValue}>{item.truckType}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Weight</Text>
          <Text style={styles.detailValue}>
            {item.loadDetails?.weight || 0} kg
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Pickup Date</Text>
          <Text style={styles.detailValue}>
            {new Date(item.pickupDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.status === "assigned" && (
        <View style={styles.driverInfo}>
          <Text style={styles.driverLabel}>🚚 Driver assigned - Track shipment</Text>
        </View>
      )}
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewQuotesBtn}
          onPress={() => {
            console.log('[MyBookings] Navigating to BookingQuotes with ID:', item._id);
            navigation.navigate("BookingQuotes", { bookingId: item._id });
          }}
        >
          <Text style={styles.viewQuotesBtnText}>View Quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => {
            console.log('[MyBookings] Navigating to Tracking with ID:', item._id);
            navigation.navigate("Tracking", { bookingId: item._id });
          }}
        >
          <Text style={styles.trackBtnText}>Track</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7b2ff2" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity
          style={styles.newBookingBtn}
          onPress={() => navigation.navigate("Booking")}
        >
          <Text style={styles.newBookingBtnText}>+ New Booking</Text>
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>
            Create your first booking to get started
          </Text>
          <TouchableOpacity
            style={styles.createBookingBtn}
            onPress={() => navigation.navigate("Booking")}
          >
            <Text style={styles.createBookingBtnText}>Create Booking</Text>
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
    </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  newBookingBtn: {
    backgroundColor: "#7b2ff2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newBookingBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,    padding: 16,
    paddingBottom: 0,  },
  bookingId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  routeContainer: {
    marginBottom: 16,    paddingHorizontal: 16,  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  arrowContainer: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  arrow: {
    fontSize: 16,
    color: "#9ca3af",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "500",
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
  actionButtons: {
    flexDirection: "row",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  viewQuotesBtn: {
    flex: 1,
    backgroundColor: "#7b2ff2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7b2ff2",
  },
  trackBtnText: {
    color: "#7b2ff2",
    fontSize: 13,
    fontWeight: "600",
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
    backgroundColor: "#7b2ff2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBookingBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
