import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import api from "../services/api.service";

export default function NotificationScreen() {
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
      <LinearGradient
        colors={["#1E3A8A", "#2563EB"]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#1E3A8A", "#2563EB"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
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
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="bell" size={18} color="#1E3A8A" />
                <AppText weight="bold" style={styles.title}>
                  {item.title}
                </AppText>
              </View>

              <AppText style={styles.body}>
                {item.body}
              </AppText>

              <AppText style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </AppText>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="bell-off" size={40} color="#94A3B8" />
              <AppText style={styles.emptyText}>
                No notifications yet
              </AppText>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },

  headerTitle: {
    fontSize: 26,
    color: "#fff",
  },

  content: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  title: {
    fontSize: 15,
    color: "#1E293B",
  },

  body: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
  },

  date: {
    fontSize: 12,
    color: "#94A3B8",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyText: {
    marginTop: 10,
    color: "#94A3B8",
  },
});