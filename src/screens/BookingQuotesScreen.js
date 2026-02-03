import React, { useState, useEffect } from "react";
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
} from "react-native";
import bookingService from "../services/booking.service";

const API_BASE_URL = "http://172.20.10.6:5000";

export default function BookingQuotesScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selecting, setSelecting] = useState(false);

  console.log('[BookingQuotesScreen] Screen loaded with bookingId:', bookingId);

  useEffect(() => {
    if (!bookingId) {
      console.error('[BookingQuotesScreen] No bookingId provided!');
      Alert.alert("Error", "No booking ID provided");
      return;
    }
    console.log('[BookingQuotesScreen] Mounted with bookingId:', bookingId);
    fetchBooking();
    // Auto-refresh every 5 seconds to see new quotes
    const interval = setInterval(fetchBooking, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      if (!loading) setRefreshing(true);
      const data = await bookingService.getBookingById(bookingId);
      console.log('[BookingQuotes] Raw API response:', JSON.stringify(data, null, 2));
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

  const onRefresh = async () => {
    await fetchBooking();
  };

  const handleSelectQuote = async (quoteIndex) => {
    try {
      setSelecting(true);
      await bookingService.selectQuote(bookingId, quoteIndex);
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
        <Text style={styles.quoteTitle}>Quote #{index + 1}</Text>
        <Text style={styles.quotedBy}>
          By: {item.quotedBy === "driver" ? "Driver" : "Admin"}
        </Text>
      </View>
      <View style={styles.quoteDetails}>
        <Text style={styles.amount}>₹ {item.amount || 0}</Text>
        {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
        <Text style={styles.createdAt}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.selectButton, (selecting || booking?.rateConfirmation?.status !== "not_generated") && styles.selectButtonDisabled]}
        onPress={() => handleSelectQuote(index)}
        disabled={selecting || booking?.rateConfirmation?.status !== "not_generated"}
      >
        <Text style={styles.selectButtonText}>Select Quote</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7b2ff2" />
        <Text style={styles.loadingText}>Loading booking...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const quotes = booking.quotations || [];
  const rateConfirmationStatus = booking.rateConfirmation?.status || "not_generated";

  return (
    <View style={styles.container}>
      {/* Booking Header */}
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingTitle}>Booking Quotes</Text>
        <Text style={styles.bookingId}>ID: {bookingId?.slice(-8) || 'N/A'}</Text>
        {booking && (
          <>
            <Text style={styles.bookingRoute}>
              {booking.pickupLocation?.address?.slice(0, 30)}...{'\n'}→ {booking.deliveryLocation?.address?.slice(0, 30)}...
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {rateConfirmationStatus.toUpperCase().replace(/_/g, " ")}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Selected Quote Info */}
      {booking.selectedQuote && (
        <View style={styles.selectedQuoteContainer}>
          <Text style={styles.selectedQuoteTitle}>Selected Quote</Text>
          <Text style={styles.selectedAmount}>₹ {booking.selectedQuote.amount}</Text>
          <Text style={styles.statusInfo}>
            Status: {rateConfirmationStatus.toUpperCase().replace(/_/g, " ")}
          </Text>
          
          {/* Action Buttons */}
          <View style={styles.pdfButtonsRow}>
            {booking.rateConfirmation?.pdfUrl && (
              <TouchableOpacity
                style={styles.viewPdfButton}
                onPress={() => {
                  const fullUrl = `${API_BASE_URL}${booking.rateConfirmation.pdfUrl}`;
                  Linking.openURL(fullUrl).catch(err => {
                    Alert.alert("Error", "Cannot open PDF: " + err.message);
                  });
                }}
              >
                <Text style={styles.viewPdfButtonText}>📄 View PDF</Text>
              </TouchableOpacity>
            )}
            
            {rateConfirmationStatus === "generated" && (
              <TouchableOpacity
                style={styles.signButton}
                onPress={() => navigation.navigate("Signature", { bookingId })}
              >
                <Text style={styles.signButtonText}>✍️ Sign Now</Text>
              </TouchableOpacity>
            )}
            
            {rateConfirmationStatus === "not_generated" && (
              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>⏳ PDF will be generated after selection</Text>
              </View>
            )}
            
            {rateConfirmationStatus === "user_signed" && (
              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>✓ Signed - Waiting for driver acceptance</Text>
              </View>
            )}
            
            {rateConfirmationStatus === "driver_accepted" && (
              <View style={styles.completedBox}>
                <Text style={styles.completedText}>✓ Completed - Ready for pickup</Text>
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
          <Text style={styles.emptyText}>No quotes yet</Text>
          <Text style={styles.emptySubText}>
            Waiting for drivers to submit quotes...
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
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
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    marginBottom: 20,
  },
  bookingHeader: {
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  bookingId: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  bookingRoute: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976d2",
  },
  selectedQuoteContainer: {
    backgroundColor: "#fff3e0",
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  selectedQuoteTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e65100",
  statusInfo: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
    fontWeight: "500",
  },
  pdfButtonsRow: {
    marginTop: 15,
    gap: 10,
  },
  viewPdfButton: {
    backgroundColor: "#ff9800",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  viewPdfButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  signButton: {
    backgroundColor: "#4caf50",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 15,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  signButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  waitingBox: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  waitingText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
  },
  completedBox: {
    backgroundColor: "#d4edda",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4caf50",
  },
  completedText: {
    color: "#155724",
    fontSize: 14,
    fontWeight: "600",
  },
    marginBottom: 5,
  },
  selectedAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff9800",
    marginBottom: 5,
  },
  pdfUrl: {
    fontSize: 11,
    color: "#666",
    marginTop: 5,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  quoteCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  quoteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  quoteTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  quotedBy: {
    fontSize: 12,
    color: "#999",
  },
  quoteDetails: {
    marginBottom: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7b2ff2",
    marginBottom: 5,
  },
  notes: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },
  createdAt: {
    fontSize: 11,
    color: "#999",
  },
  selectButton: {
    backgroundColor: "#7b2ff2",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  selectButtonDisabled: {
    backgroundColor: "#ccc",
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 13,
    color: "#ccc",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  backButton: {
    backgroundColor: "#7b2ff2",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
