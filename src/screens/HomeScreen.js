import React, { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from "react-native";
import bookingService from "../services/booking.service";
import authService from "../services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api.service";
import { DeviceEventEmitter } from "react-native";
import AppText from "../components/AppText";

export default function HomeScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    fetchCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCount();
    }, [])
  );

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener(
      "refreshNotifications",
      () => {
        fetchCount();
      }
    );
    return () => listener.remove();
  }, []);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener(
      "openNotification",
      (data) => {
        if (data?.type === "trip_status") {
          navigation.navigate("TrackingScreen", {
            tripId: data.tripId,
          });
        }
      }
    );
    return () => listener.remove();
  }, []);

  const fetchCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.count);
    } catch (err) {
      console.log("Unread count error:", err);
    }
  };

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        navigation.replace("Login");
        return;
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);

      const bookingsData = await bookingService.getMyBookings();
      setBookings(bookingsData);
    } catch (error) {
      if (error?.response?.status === 401) {
        await authService.logout();
        navigation.replace("Login");
      } else {
        console.error("Home load error:", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate("Tracking", { bookingId: item._id })
      }
    >
      <View style={styles.bookingHeader}>
        <AppText weight="semiBold" style={styles.bookingId}>
          #{item._id?.slice(-6).toUpperCase()}
        </AppText>

        <AppText
          style={[
            styles.statusBadge,
            item.status === "ACCEPTED" && styles.statusAccepted,
            item.status === "PENDING" && styles.statusPending,
            item.status === "CONFIRMED" && styles.statusConfirmed,
            item.status === "completed" && styles.statusCompleted,
            item.status === "CANCELLED" && styles.statusCancelled,
            item.status === "REJECTED" && styles.statusCancelled,
            item.status === "POD_APPROVED" && styles.statusApproved,
          ]}
        >
          {item.status.replace(/_/g, " ")}
        </AppText>
      </View>

      <AppText weight="semiBold" style={styles.routeText}>
        {item.pickupLocation?.address || "N/A"} →{" "}
        {item.deliveryLocation?.address || "N/A"}
      </AppText>

      <AppText weight="semiBold" style={styles.metaText}>
        📅 {new Date(item.createdAt).toLocaleDateString()}
      </AppText>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* STATUS BAR */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <AppText weight="bold" style={styles.greeting}>
            Welcome back
          </AppText>
          <AppText weight="semiBold" style={styles.userName}>
            {user?.firstName || "User"}
          </AppText>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Feather name="bell" size={22} color="#111827" />
            {unread > 0 && (
              <View style={styles.badge}>
                <AppText weight="semiBold" style={styles.badgeText}>
                  {unread}
                </AppText>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Feather name="user" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => navigation.navigate("Booking")}
        >
          <Feather name="plus" size={18} color="#fff" />
          <AppText weight="semiBold" style={styles.primaryActionText}>
            New Booking
          </AppText>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("MyBookings")}
          >
            <MaterialIcons name="list-alt" size={18} color="#1E3A8A" />
            <AppText weight="semiBold" style={styles.secondaryText}>
              All Bookings
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("Invoices")}
          >
            <MaterialIcons name="receipt" size={18} color="#1E3A8A" />
            <AppText weight="semiBold" style={styles.secondaryText}>
              Invoices
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      <AppText weight="bold" style={styles.sectionTitle}>
        My Bookings
      </AppText>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 43,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  greeting: {
    fontSize: 14,
    color: "#6B7280",
  },

  userName: {
    fontSize: 22,
    color: "#111827",
  },

  headerRight: {
    flexDirection: "row",
    gap: 15,
  },

  iconButton: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
  },

  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  primaryAction: {
    backgroundColor: "#1E3A8A",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  primaryActionText: {
    color: "#fff",
    fontSize: 16,
  },

  secondaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  secondaryAction: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  secondaryText: {
    marginTop: 6,
    fontSize: 14,
    color: "#1E3A8A",
  },

  sectionTitle: {
    fontSize: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 10,
  },

  listContainer: {
    padding: 15,
  },

  bookingCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
  },

  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  bookingId: {
    fontSize: 13,
    color: "#6B7280",
  },

  routeText: {
    fontSize: 15,
    color: "#111827",
    marginBottom: 8,
  },

  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    fontSize: 11,
    overflow: "hidden",
  },

  statusAccepted: { backgroundColor: "#DCFCE7", color: "#166534" },
  statusPending: { backgroundColor: "#FEF3C7", color: "#92400E" },
  statusConfirmed: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
  statusCompleted: { backgroundColor: "#E0F2FE", color: "#075985" },
  statusCancelled: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  statusApproved: { backgroundColor: "#EDE9FE", color: "#5B21B6" },
});