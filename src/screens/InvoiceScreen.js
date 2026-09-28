import React, { useState, useEffect, useRef,useCallback } from "react";
import io from "socket.io-client";

import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  AppState,
  StatusBar,
} from "react-native";
import invoiceService from "../services/invoice.service";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";
import { useFocusEffect } from "@react-navigation/native";
import { API_ORIGIN } from "../config/api.config";


export default function InvoiceScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);

  useFocusEffect(
    useCallback(()=>{
      loadInvoices()
    },[])
  )

  useEffect(() => {
    socketRef.current = io(API_ORIGIN);

    const initialize = async () => {
      loadInvoices();

      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);

      if (parsedUser?._id) {
        socketRef.current.emit("join-user", parsedUser._id);
      }
    };

    initialize();

    socketRef.current.on("paymentUpdate", (data) => {
      Alert.alert(data.message);
      loadInvoices();
    });

    return () => {
      socketRef.current.off("paymentUpdate");
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadInvoices();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getMyInvoices();
      setInvoices(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load invoices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

const handlePayment = async (invoiceId, method = "online") => {
  try {
    if (method === "online") {
      // Online payment
      const response = await invoiceService.payInvoice(invoiceId, {
        paymentMethod: "online",
      });

      if (response?.checkoutUrl) {
        await WebBrowser.openBrowserAsync(response.checkoutUrl);
      } else {
        Alert.alert("Error", "Unable to initiate payment");
      }

    } else {
      // 🔥 OFFLINE → Only fetch bank details (NO status change)
      const response = await invoiceService.payInvoice(invoiceId, {
        paymentMethod: "offline",
      });

      navigation.navigate("BankTransfer", {
        invoiceId,
        bankDetails: response.bankDetails,
      });
    }

  } catch (error) {
    console.log("Payment error:", error);
    Alert.alert("Payment failed", "Please try again.");
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const renderInvoiceItem = ({ item }) => {
    const isPending = item.status === "pending_payment";
    const isPaid = item.status === "paid";

    return (
      <View style={styles.invoiceCard}>
        <View style={styles.invoiceTop}>
          <AppText style={styles.invoiceId}>
            INV #{item._id.slice(0, 8)}
          </AppText>

          <View
            style={[
              styles.statusBadge,
              isPending && styles.pendingBadge,
              isPaid && styles.paidBadge,
            ]}
          >
            <Feather
              name={isPaid ? "check-circle" : isPending ? "clock" : "info"}
              size={11}
              color={isPaid ? colors.statusSuccess : isPending ? colors.statusWarning : colors.statusNeutral}
              style={{ marginRight: 4 }}
            />
            <AppText weight="semiBold" style={styles.statusText}>
              {item.status.replace(/_/g, " ").toUpperCase()}
            </AppText>
          </View>
        </View>

        <AppText variant="largePrice" style={styles.amount}>
          ${item.totalAmount}
        </AppText>

        <View style={styles.routeBox}>
          <AppText style={styles.routeLabel}>Pickup</AppText>
          <AppText style={styles.routeText}>
            {item.trip?.bookingId?.pickupLocation?.address || "N/A"}
          </AppText>

          <AppText style={[styles.routeLabel, { marginTop: 10 }]}>Drop</AppText>
          <AppText style={styles.routeText}>
            {item.trip?.bookingId?.deliveryLocation?.address || "N/A"}
          </AppText>
        </View>

        {isPending && (
          <View style={{ marginTop: 15 }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handlePayment(item._id)}
            >
              <AppText style={styles.primaryButtonText}>
                Pay Online
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handlePayment(item._id, "offline")}
            >
              <AppText style={styles.secondaryButtonText}>
                Bank Transfer
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* STATUS BAR */}
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <AppText variant="sectionTitle" style={styles.title}>
          My Invoices
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={invoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AppText weight="semiBold" style={styles.emptyText}>
              No invoices found
            </AppText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
  },

  listContainer: {
    padding: 16,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  invoiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  invoiceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  invoiceId: {
    fontWeight: "600",
    color: colors.text,
  },

  amount: {
    color: colors.primary,
    marginTop: 8,
  },

  routeBox: {
    marginTop: 14,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },

  routeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },

  routeText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  paidBadge: {
    backgroundColor: "#DCFCE7",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
  },

  emptyText: {
    color: colors.textMuted,
  },
});

