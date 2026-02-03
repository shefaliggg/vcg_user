import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import bookingService from "../services/booking.service";
import authService from "../services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setBookings([]);
        setLoading(false);
        setRefreshing(false);
        // If unauthenticated, go to Login
        navigation.replace("Login");
        return;
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);

      const bookingsData = await bookingService.getMyBookings();
      setBookings(bookingsData);
    } catch (error) {
      // On 401, clear auth and navigate to Login
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

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          navigation.replace("Login");
        },
      },
    ]);
  };

  const renderBookingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => navigation.navigate("Tracking", { bookingId: item._id })}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>#{item._id?.slice(-6)}</Text>
        <Text style={[styles.status, styles[`status${item.status}`]]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.bookingRoute}>
        {item.pickupLocation?.address || "N/A"} → {item.deliveryLocation?.address || "N/A"}
      </Text>
      <Text style={styles.bookingDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.firstName || "User"}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.profileButton}
          >
            <Text style={styles.profileText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("Booking")}
        >
          <Text style={styles.actionButtonText}>+ New Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate("MyBookings")}
        >
          <Text style={styles.actionButtonTextSecondary}>View All Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => navigation.navigate("Invoices")}
        >
          <Text style={styles.actionButtonTextSecondary}>View Invoices</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Bookings</Text>

      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first booking to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3e6ff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#7b2ff2",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 16,
  },
  userName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  profileButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  profileText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#7b2ff2",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#7b2ff2",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  actionButtonTextSecondary: {
    color: "#7b2ff2",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },
  listContainer: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  bookingId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statuspending: {
    backgroundColor: "#f3e6ff",
    color: "#7b2ff2",
  },
  statusconfirmed: {
    backgroundColor: "#e6d6fa",
    color: "#7b2ff2",
  },
  statuscompleted: {
    backgroundColor: "#d1b3f7",
    color: "#4b006e",
  },
  statuscancelled: {
    backgroundColor: "#ffe6e6",
    color: "#b71c1c",
  },
  bookingRoute: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  bookingDate: {
    fontSize: 12,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});
