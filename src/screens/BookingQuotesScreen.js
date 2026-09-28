import React, { useState, useEffect,useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Dimensions
} from "react-native";
import bookingService from "../services/booking.service";
import AppText from "../components/AppText";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { API_ORIGIN } from "../config/api.config";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

const RATE_STATUS_META = {
  not_generated: { icon: "clock", color: colors.statusPending },
  awaiting_user_signature: { icon: "edit-3", color: colors.statusWarning },
  user_signed: { icon: "check-circle", color: colors.statusPending },
  driver_accepted: { icon: "check-circle", color: colors.statusSuccess },
};

export default function BookingQuotesScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState(false);

  console.log('[BookingQuotesScreen] Screen loaded with bookingId:', bookingId);

useFocusEffect(
  useCallback(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId])
);

  const fetchBooking = async () => {
    try {
      if (!loading) setRefreshing(true);
      const data = await bookingService.getBookingById(bookingId);
      // console.log('[BookingQuotes] Raw API response:', JSON.stringify(data, null, 2));
      console.log('[BookingQuotes] Quotations array:', data?.quotations);
      console.log('[BookingQuotes] Number of quotes:', data?.quotations?.length || 0);
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking:", error?.response?.data || error.message);
      if (loading) {
        Alert.alert("Error", "Failed to fetch booking details");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const selectedQuotation = booking?.quotations?.find(q => q.selected);

  const selectedPrice = selectedQuotation?.price ?? 0;

const selectedDriverName =
  selectedQuotation?.driverId?.userId
    ? `${selectedQuotation.driverId.userId.firstName} ${selectedQuotation.driverId.userId.lastName}`
    : "Driver";

  const onRefresh = async () => {
    await fetchBooking();
  };

  const handleSelectQuote = async (quoteIndex) => {
    try {
      setSelecting(true);
      const updatedBooking = await bookingService.selectQuote(bookingId, quoteIndex);
      console.log('[handleSelectQuote] Updated booking after selection:', JSON.stringify(updatedBooking, null, 2));
      setBooking(updatedBooking); // Immediate update
      Alert.alert("Success", "Quote selected! PDF has been generated.", [
        { text: "OK", onPress: () => fetchBooking() },
      ]);
    } catch (error) {
      console.error("Error selecting quote:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to select quote"
      );
    } finally {
      setSelecting(false);
    }
  };

  const renderQuoteItem = ({ item, index }) => (
    <View style={styles.quoteCard}>
      <View style={styles.quoteHeader}>
        <AppText variant="cardTitle" style={styles.quoteTitle}>Quote #{index + 1}</AppText>
        <AppText weight="semiBold" style={styles.quotedBy}>
          By: {
            item.driverId?.userId?.firstName
              ? `${item.driverId.userId.firstName} ${item.driverId.userId.lastName}`
              : "Driver"
          }
        </AppText>
      </View>
      <View style={styles.quoteDetails}>
        <AppText variant="largePrice" style={styles.amount}>$ {item.price != null ? item.price : 0}</AppText>
        {item.notes && <AppText style={styles.notes}>{item.notes}</AppText>}
        <AppText style={styles.createdAt}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </AppText>
      </View>
      <TouchableOpacity
        style={[styles.selectButton, (selecting || booking?.rateConfirmation?.status !== "not_generated") && styles.selectButtonDisabled]}
        onPress={() => handleSelectQuote(index)}
        disabled={selecting || booking?.rateConfirmation?.status !== "not_generated"}
      >
        <AppText weight="semiBold" style={styles.selectButtonText}>Select Quote</AppText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText weight="semiBold" style={styles.loadingText}>Loading booking...</AppText>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <AppText weight="semiBold" style={styles.errorText}>Booking not found</AppText>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AppText weight="semiBold" style={styles.backButtonText}>Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  // Debug: Log rateConfirmation and selectedQuote object
  // console.log('rateConfirmation:', booking.rateConfirmation);
  console.log('selectedQuote:', booking.quotations[0]?.selected);

  const quotes = booking.quotations || [];
  const rateConfirmationStatus = booking.rateConfirmation?.status || "not_generated";
  const rateStatusMeta =
    RATE_STATUS_META[rateConfirmationStatus] || {
      icon: "info",
      color: colors.statusNeutral,
    };

  return (
    <View style={styles.container}>
      {/* Booking Header */}
      <View style={styles.bookingHeader}>


     <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        <AppText weight="bold" style={styles.bookingTitle}>Booking Quotes</AppText>
        <AppText weight="semiBold" style={styles.bookingId}>ID: {bookingId?.slice(-8) || 'N/A'}</AppText>

        <>
          <AppText weight="semiBold" style={styles.bookingRoute}>
            {booking.pickupLocation?.address?.slice(0, 30)}...{'\n'}→ {booking.deliveryLocation?.address?.slice(0, 30)}...
          </AppText>
          <View style={styles.statusBadge}>
            <Feather name={rateStatusMeta.icon} size={12} color="#fff" />
            <AppText weight="semiBold" style={styles.statusText}>
              {rateConfirmationStatus.toUpperCase().replace(/_/g, " ")}
            </AppText>
          </View>
        </>
      </View>

      {/* Selected Quote Info */}
      {(booking.selectedQuote || (booking.rateConfirmation && booking.rateConfirmation.pdfUrl)) && (
        <View style={styles.selectedQuoteContainer}>
          <AppText weight="semiBold" style={styles.selectedQuoteTitle}>Selected Quote</AppText>
          <AppText variant="largePrice" style={styles.selectedAmount}>
            ${selectedPrice}
          </AppText>
          <AppText weight="semiBold" style={styles.statusInfo}>
            Status: {rateConfirmationStatus.toUpperCase().replace(/_/g, " ")}
          </AppText>
          {/* Show driver name if available */}
          <AppText weight="semiBold" style={styles.quotedBy}>
            Quoted By: {selectedDriverName}
          </AppText>
          {/* Action Buttons */}
          <View style={styles.pdfButtonsRow}>
            {booking.rateConfirmation?.pdfUrl  && rateConfirmationStatus !== "awaiting_user_signature" && (
              <TouchableOpacity
                style={styles.viewPdfButton}
                onPress={() => {
                  const fullUrl = `${API_ORIGIN}${booking.rateConfirmation.pdfUrl}`;
                  Linking.openURL(fullUrl).catch(err => {
                    Alert.alert("Error", "Cannot open PDF: " + err.message);
                  });
                }}
              >
                <AppText weight="semiBold" style={styles.viewPdfButtonText}>📄 View PDF</AppText>
              </TouchableOpacity>
            )}
            {rateConfirmationStatus === "awaiting_user_signature" && (
              <TouchableOpacity
                style={styles.signButton}
                onPress={() => navigation.navigate("Signature", { bookingId })}
              >
                <AppText weight="semiBold" style={styles.signButtonText}>✍️ Sign Now</AppText>
              </TouchableOpacity>
            )}
            {rateConfirmationStatus === "not_generated" && (
              <View style={styles.waitingBox}>
                <Feather name="clock" size={14} color={colors.statusWarning} />
                <AppText weight="semiBold" style={styles.waitingText}>PDF will be generated after selection</AppText>
              </View>
            )}
            {rateConfirmationStatus === "user_signed" && (
              <View style={styles.waitingBox}>
                <Feather name="check-circle" size={14} color={colors.statusWarning} />
                <AppText weight="semiBold" style={styles.waitingText}>Signed - Waiting for driver acceptance</AppText>
              </View>
            )}
            {rateConfirmationStatus === "driver_accepted" && (
              <View style={styles.completedBox}>
                <Feather name="check-circle" size={14} color={colors.statusSuccess} />
                <AppText weight="semiBold" style={styles.completedText}>Completed - Ready for pickup</AppText>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Quotes List */}
      {quotes.length > 0 ? (
        <FlatList
          data={quotes}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <AppText weight="semiBold" style={styles.emptyText}>No quotes yet</AppText>
          <AppText weight="normal" style={styles.emptySubText}>
            Waiting for drivers to submit quotes...
          </AppText>
        </View>
      )}


    </View>
  );
}

const {height}=Dimensions.get("window")
const styles = StyleSheet.create({
  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.sm,
},

headerBack: {
  width: 36,
  height: 36,
  borderRadius: 10,
  backgroundColor: "rgba(255,255,255,0.2)",
  justifyContent: "center",
  alignItems: "center",
},
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  bookingHeader: {
    backgroundColor: colors.primary,
    paddingTop: 55,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.white,
    marginBottom: spacing.sm,
  },

  bookingId: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing.sm,
  },

  bookingRoute: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  selectedQuoteContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  selectedQuoteTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e65100",
  },
  statusInfo: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 5,
    fontWeight: "500",
  },
  pdfButtonsRow: {
    marginTop: spacing.base,
    gap: spacing.sm,
  },

  viewPdfButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    alignItems: "center",
  },
  signButton: {
    backgroundColor: colors.success,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 15,
    alignItems: "center",
    ...shadows.card,
  },
  signButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  waitingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  waitingText: {
    color: colors.statusWarning,
    fontSize: 14,
    fontWeight: "600",
  },
  completedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "#d4edda",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.success,
  },
  completedText: {
    color: colors.statusSuccess,
    fontSize: 14,
    fontWeight: "600",
  },
  selectedAmount: {
    color: colors.primary,
    marginVertical: 6,
  },
  pdfUrl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 5,
  },
  listContainer: {
    padding: spacing.base,
    paddingBottom: 120,
  },

  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  quoteTitle: {
    color: colors.text,
  },
  quotedBy: {
    fontSize: 12,
    color: colors.textMuted,
  },
  quoteDetails: {
    marginBottom: spacing.md,
  },
  amount: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 5,
  },
  createdAt: {
    fontSize: 11,
    color: colors.textMuted,
  },
  selectButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    alignItems: "center",
  },
  selectButtonDisabled: {
    backgroundColor: "#ccc",
  },
  selectButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  viewPdfButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 13,
    color: "#ccc",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    bottom: height*0.03,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,

  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  selectedQuoteTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
