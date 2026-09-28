import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import bookingService from "../services/booking.service";
import AppText from "../components/AppText";
import { API_ORIGIN } from "../config/api.config";
import { showAlert } from "../utils/alert";
import { getLoadStage, timeAgo } from "../utils/loadStatus";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "TBD");

const driverNameOf = (q) => {
  const u = q?.driverId?.userId;
  const name = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "";
  return name || "Driver";
};

const Stars = ({ rating, total }) => (
  <View style={styles.ratingRow}>
    <Feather name="star" size={13} color={total > 0 ? colors.warning : colors.border} />
    <AppText weight="semiBold" style={styles.ratingText}>
      {total > 0 ? `${Number(rating).toFixed(1)} (${total})` : "New driver"}
    </AppText>
  </View>
);

export default function LoadDetailsScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [profileQuote, setProfileQuote] = useState(null);

  const fetchBooking = async () => {
    try {
      setBooking(await bookingService.getBookingById(bookingId));
    } catch (error) {
      console.error("Failed to fetch load:", error?.response?.data || error.message);
      if (!booking) showAlert("Error", "Failed to load details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (bookingId) fetchBooking();
    }, [bookingId])
  );

  const acceptQuote = (index) => {
    const q = booking.quotations[index];
    showAlert(
      "Accept this quote?",
      `${driverNameOf(q)} for $${q.price}. Other quotes will be closed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept Quote",
          onPress: async () => {
            try {
              setAccepting(true);
              await bookingService.selectQuote(bookingId, index);
              setProfileQuote(null);
              await fetchBooking();
            } catch (error) {
              showAlert("Error", error.response?.data?.message || "Failed to accept quote");
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <AppText weight="semiBold" style={{ color: colors.error, marginBottom: spacing.lg }}>
          Load not found
        </AppText>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <AppText weight="semiBold" style={styles.primaryBtnText}>Go Back</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  const stage = getLoadStage(booking);
  const quotes = booking.quotations || [];
  const rc = booking.rateConfirmation?.status || "not_generated";
  // Quote selection is only allowed while nothing has been accepted yet.
  const canAccept = booking.status === "OPEN_FOR_QUOTES" && rc === "not_generated" && !booking.isDraft;
  const acceptedIndex = quotes.findIndex((q) => q.selected);
  const accepted = acceptedIndex >= 0 ? quotes[acceptedIndex] : null;
  // Accepted quote first, then cheapest first.
  const ordered = quotes
    .map((q, index) => ({ q, index }))
    .sort((a, b) => (b.q.selected ? 1 : 0) - (a.q.selected ? 1 : 0) || a.q.price - b.q.price);
  const shownQuotes = accepted ? ordered.filter(({ q }) => q.selected) : ordered;

  const renderQuote = ({ q, index }) => {
    const d = q.driverId || {};
    return (
      <View key={q._id || index} style={[styles.quoteCard, q.selected && styles.quoteCardSelected]}>
        <View style={styles.quoteTop}>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" style={styles.driverName}>{driverNameOf(q)}</AppText>
            <Stars rating={d.averageRating} total={d.totalRatings || 0} />
          </View>
          <AppText weight="bold" style={styles.price}>${q.price}</AppText>
        </View>

        {!!q.notes && <AppText style={styles.notes}>{q.notes}</AppText>}
        <AppText style={styles.submitted}>Submitted {timeAgo(q.createdAt)}</AppText>

        <View style={styles.quoteActions}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setProfileQuote(q)}>
            <AppText weight="semiBold" style={styles.outlineBtnText}>View Profile</AppText>
          </TouchableOpacity>
          {canAccept && (
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }, accepting && { opacity: 0.5 }]}
              disabled={accepting}
              onPress={() => acceptQuote(index)}
            >
              <AppText weight="semiBold" style={styles.primaryBtnText}>Accept Quote</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const nextStep = () => {
    if (rc === "awaiting_user_signature") {
      return (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Signature", { bookingId })}
        >
          <AppText weight="semiBold" style={styles.primaryBtnText}>Sign Rate Confirmation</AppText>
        </TouchableOpacity>
      );
    }
    if (rc === "user_signed") {
      return <Notice icon="clock" text="Signed — waiting for the driver to accept" color={colors.statusWarning} />;
    }
    if (rc === "driver_accepted") {
      return (
        <View style={{ gap: spacing.sm }}>
          <Notice icon="check-circle" text="Driver assigned — ready for pickup" color={colors.statusSuccess} />
          {!!booking.rateConfirmation?.pdfUrl && (
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => Linking.openURL(`${API_ORIGIN}${booking.rateConfirmation.pdfUrl}`)}
            >
              <AppText weight="semiBold" style={styles.outlineBtnText}>View Rate Confirmation</AppText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("Tracking", { bookingId })}
          >
            <AppText weight="semiBold" style={styles.primaryBtnText}>Track Shipment</AppText>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const pd = profileQuote?.driverId || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <AppText variant="screenTitle" style={{ flex: 1, color: colors.text }}>
          Load #{booking._id?.slice(-6).toUpperCase()}
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBooking();
            }}
          />
        }
      >
        {/* Load summary */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <AppText style={styles.label}>Load Status</AppText>
            <View style={[styles.pill, { backgroundColor: `${stage.color}1A` }]}>
              <AppText weight="semiBold" style={[styles.pillText, { color: stage.color }]}>
                {stage.label}
              </AppText>
            </View>
          </View>

          <View style={styles.routeRow}>
            <Feather name="map-pin" size={16} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <AppText style={styles.label}>Pickup · {fmtDate(booking.pickupDate)}</AppText>
              <AppText weight="semiBold" style={styles.routeText}>{booking.pickupLocation?.address || "N/A"}</AppText>
            </View>
          </View>
          <View style={styles.routeRow}>
            <Feather name="navigation" size={16} color={colors.textMuted} />
            <View style={{ flex: 1 }}>
              <AppText style={styles.label}>Delivery · {fmtDate(booking.deliveryDate)}</AppText>
              <AppText weight="semiBold" style={styles.routeText}>{booking.deliveryLocation?.address || "N/A"}</AppText>
            </View>
          </View>

          <View style={styles.factsRow}>
            <Fact label="Truck" value={booking.truckType || "—"} />
            <Fact label="Weight" value={booking.loadDetails?.weight ? `${booking.loadDetails.weight} lbs` : "—"} />
            <Fact label="Commodity" value={booking.loadDetails?.type || "—"} />
          </View>
        </View>

        {/* Quotes */}
        {!booking.isDraft && (
          <View style={styles.section}>
            <AppText weight="bold" style={styles.sectionTitle}>
              {accepted ? "Accepted Quote" : `💰 Quotes Received — ${quotes.length}`}
            </AppText>

            {accepted && (
              <View style={{ marginBottom: spacing.md }}>{nextStep()}</View>
            )}

            {shownQuotes.length > 0 ? (
              shownQuotes.map(renderQuote)
            ) : (
              <View style={styles.empty}>
                <Feather name="clock" size={28} color={colors.textMuted} />
                <AppText weight="semiBold" style={styles.emptyTitle}>No quotes yet</AppText>
                <AppText style={styles.emptyText}>Drivers can quote on your load. Pull down to refresh.</AppText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Driver profile sheet */}
      <Modal visible={!!profileQuote} transparent animationType="slide" onRequestClose={() => setProfileQuote(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <AppText weight="bold" style={styles.sheetTitle}>{profileQuote ? driverNameOf(profileQuote) : ""}</AppText>
              <TouchableOpacity onPress={() => setProfileQuote(null)}>
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Stars rating={pd.averageRating} total={pd.totalRatings || 0} />
            <View style={{ marginTop: spacing.base, gap: spacing.md }}>
              <Row label="CDL class" value={pd.cdlClass ? `Class ${pd.cdlClass}` : "—"} />
              <Row label="Endorsements" value={pd.endorsements?.length ? pd.endorsements.join(", ") : "None"} />
              <Row
                label="CDL experience"
                value={pd.qualification?.yearsCdlExperience != null ? `${pd.qualification.yearsCdlExperience} yrs` : "—"}
              />
              <Row label="Truck" value={pd.vehicleType || "—"} />
              <Row label="Quoted price" value={profileQuote ? `$${profileQuote.price}` : ""} />
            </View>
            {profileQuote && canAccept && (
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: spacing.lg }, accepting && { opacity: 0.5 }]}
                disabled={accepting}
                onPress={() => acceptQuote(quotes.indexOf(profileQuote))}
              >
                <AppText weight="semiBold" style={styles.primaryBtnText}>Accept Quote</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Fact = ({ label, value }) => (
  <View style={{ flex: 1 }}>
    <AppText style={styles.label}>{label}</AppText>
    <AppText weight="semiBold" style={styles.factValue} numberOfLines={1}>{value}</AppText>
  </View>
);

const Row = ({ label, value }) => (
  <View style={styles.statusRow}>
    <AppText style={styles.label}>{label}</AppText>
    <AppText weight="semiBold" style={{ fontSize: 14 }}>{value}</AppText>
  </View>
);

const Notice = ({ icon, text, color }) => (
  <View style={[styles.notice, { borderColor: color, backgroundColor: `${color}14` }]}>
    <Feather name={icon} size={14} color={color} />
    <AppText weight="semiBold" style={{ color, fontSize: 13, flex: 1 }}>{text}</AppText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 34 },
  card: {
    backgroundColor: colors.surface,
    margin: spacing.base,
    padding: spacing.base,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 12, color: colors.textMuted },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 12 },
  routeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.base },
  routeText: { fontSize: 14, color: colors.text, marginTop: 2 },
  factsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  factValue: { fontSize: 13, color: colors.text, marginTop: 2 },
  section: { paddingHorizontal: spacing.base },
  sectionTitle: { fontSize: 17, color: colors.text, marginBottom: spacing.md },
  quoteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quoteCardSelected: { borderColor: colors.success, borderWidth: 2 },
  quoteTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  driverName: { fontSize: 16, color: colors.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 12, color: colors.textMuted },
  price: { fontSize: 22, color: colors.primary },
  notes: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  submitted: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm },
  quoteActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontSize: 14 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
    alignItems: "center",
  },
  outlineBtnText: { color: colors.primary, fontSize: 14 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.button,
    padding: spacing.md,
  },
  empty: { alignItems: "center", padding: spacing.xl },
  emptyTitle: { fontSize: 15, color: colors.text, marginTop: spacing.sm },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { fontSize: 18, color: colors.text },
});
