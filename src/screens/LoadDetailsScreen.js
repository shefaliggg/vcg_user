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
import tripService from "../services/trip.service";
import AppText from "../components/AppText";
import { API_ORIGIN } from "../config/api.config";
import { showAlert } from "../utils/alert";
import { getLoadStage, timeAgo, TRIP_TIMELINE_STEPS, currentTripTimelineIndex } from "../utils/loadStatus";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "TBD");

const DOC_LABELS = {
  bol: "BOL",
  rate_confirmation: "Rate Confirmation",
  pod: "Proof of Delivery",
  other: "Document",
};

// A trip becomes executable after the assigned carrier acknowledges the confirmation.
const hasActiveTrip = (b) =>
  ["carrier_acknowledged", "driver_accepted"].includes(b?.rateConfirmation?.status) ||
  ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED"].includes(String(b?.status || "").toUpperCase());

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
  const [trip, setTrip] = useState(null);
  const [invoice, setInvoice] = useState(null);

  const fetchBooking = async () => {
    try {
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);

      if (hasActiveTrip(data)) {
        try {
          setTrip(await tripService.trackByBooking(bookingId));
        } catch (tripError) {
          if (tripError.response?.status !== 404) console.error("Failed to fetch trip:", tripError.message);
        }
        try {
          const { invoice: inv } = await bookingService.getInvoiceByBooking(bookingId);
          setInvoice(inv || null);
        } catch (invoiceError) {
          console.error("Failed to fetch invoice:", invoiceError.message);
        }
      }
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
  const requirements = booking.requirements || {};
  const specialInstructions = [
    requirements.hazmat && "Hazmat",
    requirements.oversized && "Oversized load",
    requirements.teamDriverRequired && "Team driver required",
    requirements.liftgateRequired && "Liftgate required",
    booking.equipmentDetails?.temperatureRequirements && `Temp: ${booking.equipmentDetails.temperatureRequirements}`,
  ].filter(Boolean);
  const documents = trip?.documents || booking.documents || [];
  const docByType = (type) => documents.find((d) => d.docType === type);
  const activity = trip?.activity?.length ? trip.activity : (booking.statusHistory || []).slice().reverse();
  // Before a trip exists, the only known-complete stage is "Load Posted" (index 0).
  // Once the carrier acknowledges the rate confirmation, a Trip record exists and its
  // granular status drives the rest of the tracker.
  const timelineIndex = trip ? currentTripTimelineIndex(trip.status) : 0;
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
    if (rc === "awaiting_admin_approval") {
      return <Notice icon="clock" text="Quote accepted — awaiting VCG review" color={colors.statusWarning} />;
    }
    if (["awaiting_carrier_acknowledgment", "user_signed"].includes(rc)) {
      return (
        <View style={{ gap: spacing.sm }}>
          <Notice icon="clock" text="Rate Confirmation sent — awaiting carrier acknowledgment" color={colors.statusWarning} />
          {!!booking.rateConfirmation?.pdfUrl && (
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => Linking.openURL(`${API_ORIGIN}${booking.rateConfirmation.pdfUrl}`)}
            >
              <AppText weight="semiBold" style={styles.outlineBtnText}>View Rate Confirmation</AppText>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (["carrier_acknowledged", "driver_accepted"].includes(rc)) {
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
        <AppText weight="bold" style={styles.headerTitle}>
          {booking.loadNumber || `#${booking._id?.slice(-6).toUpperCase()}`}
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
            <Feather
              name={timelineIndex >= 2 ? "check-circle" : "map-pin"}
              size={16}
              color={timelineIndex >= 2 ? colors.success : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <AppText style={styles.label}>Pickup · {fmtDate(booking.pickupDate)}{timelineIndex >= 2 ? " · Completed" : ""}</AppText>
              <AppText weight="semiBold" style={styles.routeText}>{booking.pickupLocation?.address || "N/A"}</AppText>
            </View>
          </View>
          <View style={styles.routeRow}>
            <Feather
              name={timelineIndex >= 4 ? "check-circle" : "navigation"}
              size={16}
              color={timelineIndex >= 4 ? colors.success : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <AppText style={styles.label}>Delivery · {fmtDate(booking.deliveryDate)}{timelineIndex >= 4 ? " · Completed" : ""}</AppText>
              <AppText weight="semiBold" style={styles.routeText}>{booking.deliveryLocation?.address || "N/A"}</AppText>
            </View>
          </View>

          <View style={styles.factsRow}>
            <Fact label="Truck" value={booking.truckType || "—"} />
            <Fact label="Weight" value={booking.loadDetails?.weight ? `${booking.loadDetails.weight} lbs` : "—"} />
            <Fact label="Commodity" value={booking.loadDetails?.type || "—"} />
            <Fact label="Pieces" value={booking.loadDetails?.pieces ?? "—"} />
          </View>

          {specialInstructions.length > 0 && (
            <View style={styles.warningBox}>
              <Feather name="alert-triangle" size={14} color={colors.warning} />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <AppText weight="semiBold" style={styles.warningTitle}>Special Instructions</AppText>
                {specialInstructions.map((line) => (
                  <AppText key={line} style={styles.warningText}>{line}</AppText>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Trip Progress */}
        {!booking.isDraft && (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>Shipment Progress</AppText>
            {TRIP_TIMELINE_STEPS.map((step, idx) => (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      idx < timelineIndex && styles.timelineDotCompleted,
                      idx === timelineIndex && styles.timelineDotCurrent,
                    ]}
                  >
                    {idx < timelineIndex ? <Feather name="check" size={12} color={colors.white} /> : null}
                  </View>
                  {idx < TRIP_TIMELINE_STEPS.length - 1 && (
                    <View style={[styles.timelineLine, idx < timelineIndex && styles.timelineLineCompleted]} />
                  )}
                </View>
                <AppText
                  weight={idx <= timelineIndex ? "semiBold" : "regular"}
                  style={[styles.timelineLabel, idx === timelineIndex && { color: colors.primary }]}
                >
                  {step.label}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {/* Current shipment */}
        {trip && !["delivered", "completed", "pod_uploaded", "pod_approved"].includes(trip.status) && (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>Current Shipment</AppText>
            <View style={{ gap: spacing.sm }}>
              <View style={styles.statusRow}>
                <AppText style={styles.label}>Driver</AppText>
                <AppText weight="semiBold" style={{ fontSize: 14 }}>{trip.driver?.name || "N/A"}</AppText>
              </View>
              {trip.driver?.vehicleType && (
                <View style={styles.statusRow}>
                  <AppText style={styles.label}>Vehicle</AppText>
                  <AppText weight="semiBold" style={{ fontSize: 14 }}>{trip.driver.vehicleType}</AppText>
                </View>
              )}
              {trip.currentLocation?.address && (
                <View style={styles.statusRow}>
                  <AppText style={styles.label}>Current Location</AppText>
                  <AppText weight="semiBold" style={{ fontSize: 14 }}>{trip.currentLocation.address}</AppText>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: spacing.md }]}
              onPress={() => navigation.navigate("Tracking", { bookingId })}
            >
              <AppText weight="semiBold" style={styles.primaryBtnText}>Track Shipment</AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Driver / Carrier */}
        {accepted && (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>Driver / Carrier</AppText>
            <View style={styles.statusRow}>
              <View style={{ flex: 1 }}>
                <AppText weight="bold" style={styles.driverName}>{driverNameOf(accepted)}</AppText>
                <Stars rating={accepted.driverId?.averageRating} total={accepted.driverId?.totalRatings || 0} />
                {accepted.driverId?.vehicleType && (
                  <AppText style={{ ...styles.label, marginTop: 4 }}>{accepted.driverId.vehicleType}</AppText>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => setProfileQuote(accepted)}>
                  <AppText weight="semiBold" style={styles.outlineBtnText}>View Profile</AppText>
                </TouchableOpacity>
                {trip?.tripId && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => navigation.navigate("Chat", { tripId: trip.tripId, recipientName: driverNameOf(accepted) })}
                  >
                    <Feather name="message-circle" size={16} color={colors.white} />
                  </TouchableOpacity>
                )}
                {trip?.driver?.phone && (
                  <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${trip.driver.phone}`)}>
                    <Feather name="phone" size={16} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

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
                 <AppText style={styles.emptyText}>
                   {stage.key === "pending_review"
                     ? "Drivers can quote after an admin approves this load."
                     : "Drivers can quote on your load. Pull down to refresh."}
                 </AppText>
              </View>
            )}
          </View>
        )}

        {/* Documents */}
        {!booking.isDraft && (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>Documents</AppText>
            <DocRow label={DOC_LABELS.bol} doc={docByType("bol")} />
            <DocRow
              label={DOC_LABELS.rate_confirmation}
              doc={docByType("rate_confirmation") || (booking.rateConfirmation?.pdfUrl ? { fileUrl: booking.rateConfirmation.pdfUrl } : null)}
            />
            <DocRow label={DOC_LABELS.pod} doc={docByType("pod")} />
          </View>
        )}

        {/* Financial summary */}
        {!booking.isDraft && accepted && (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>Charges</AppText>
            <View style={styles.statusRow}>
              <AppText style={styles.label}>Driver Rate</AppText>
              <AppText weight="semiBold" style={{ fontSize: 14 }}>
                ${(booking.rateConfirmation?.amount ?? accepted.price) || "N/A"}
              </AppText>
            </View>
            {invoice?.onlineFee > 0 && (
              <View style={styles.statusRow}>
                <AppText style={styles.label}>VCG Service Fee</AppText>
                <AppText weight="semiBold" style={{ fontSize: 14 }}>${invoice.onlineFee}</AppText>
              </View>
            )}
            <View style={[styles.statusRow, styles.totalRow]}>
              <AppText weight="bold">Total</AppText>
              <AppText weight="bold" style={{ color: colors.primary, fontSize: 16 }}>
                ${invoice?.totalAmount ?? booking.rateConfirmation?.amount ?? accepted.price ?? "N/A"}
              </AppText>
            </View>
            <View style={[styles.statusRow, { marginTop: spacing.sm }]}>
              <AppText style={styles.label}>Payment</AppText>
              <AppText weight="semiBold" style={{ fontSize: 14, color: invoice?.status === "paid" ? colors.success : colors.textMuted }}>
                {invoice ? invoice.status.replace(/_/g, " ") : "Pending delivery"}
              </AppText>
            </View>
          </View>
        )}

        {/* Activity */}
        {activity.length > 0 && (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.sectionTitle}>Recent Activity</AppText>
            {activity.slice(0, 8).map((event, idx) => (
              <View key={`${event.status}-${event.changedAt}-${idx}`} style={styles.activityRow}>
                <AppText style={styles.activityTime}>
                  {event.changedAt ? new Date(event.changedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                </AppText>
                <AppText weight="semiBold" style={styles.activityText}>
                  {getStatusEventLabel(event.status)}
                </AppText>
                {(event.actorRole || event.actorName) ? (
                  <AppText style={styles.activityMeta}>
                    {[event.actorRole, event.actorName].filter(Boolean).join(" · ")}
                  </AppText>
                ) : null}
              </View>
            ))}
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

const DocRow = ({ label, doc }) => (
  <View style={styles.docRow}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Feather name={doc ? "check-circle" : "circle"} size={16} color={doc ? colors.success : colors.border} />
      <AppText style={{ marginLeft: spacing.sm }}>{label}</AppText>
    </View>
    {doc ? (
      <TouchableOpacity onPress={() => Linking.openURL(/^https?:\/\//i.test(doc.fileUrl) ? doc.fileUrl : `${API_ORIGIN}${doc.fileUrl}`)}>
        <AppText weight="semiBold" style={{ color: colors.primary, fontSize: 13 }}>View</AppText>
      </TouchableOpacity>
    ) : (
      <AppText style={{ color: colors.textMuted, fontSize: 12 }}>—</AppText>
    )}
  </View>
);

// Covers both Booking.status (uppercase: OPEN_FOR_QUOTES, CONFIRMED, ...) and
// Trip.status (lowercase: going_to_pickup, in_transit, ...) event labels.
const STATUS_EVENT_LABELS = {
  rate_confirmation_issued: "Rate Confirmation issued by VCG",
  carrier_acknowledged: "Carrier acknowledged Rate Confirmation",
  PENDING_APPROVAL: "Load submitted for review",
  OPEN_FOR_QUOTES: "Open for quotes",
  CONFIRMED: "Quote accepted",
  ACCEPTED: "Driver assigned",
  IN_PROGRESS: "Shipment in progress",
  DELIVERED: "Delivered",
  REJECTED: "Changes requested",
  assigned: "Driver assigned",
  accepted: "Trip accepted",
  going_to_pickup: "Driver en route to pickup",
  arrived_at_pickup: "Arrived at pickup",
  loading: "Loading",
  loaded: "Picked up",
  in_transit: "In transit",
  arrived_at_drop: "Arrived at delivery",
  delivered: "Delivered",
  completed: "Completed",
  pod_uploaded: "POD uploaded",
  pod_approved: "POD approved",
  pod_rejected: "POD rejected",
};
const getStatusEventLabel = (status) => STATUS_EVENT_LABELS[status] || String(status || "").replace(/_/g, " ");

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
  headerTitle: { flex: 1, fontSize: 17, color: colors.text },
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
  totalRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.base,
  },
  warningTitle: { color: "#92400E", fontSize: 13 },
  warningText: { color: "#92400E", fontSize: 12, marginTop: 2 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start" },
  timelineLeft: { alignItems: "center", marginRight: spacing.sm },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineDotCurrent: { borderColor: colors.primary, borderWidth: 3 },
  timelineLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border, marginVertical: 2 },
  timelineLineCompleted: { backgroundColor: colors.primary },
  timelineLabel: { fontSize: 14, color: colors.textMuted, paddingBottom: spacing.md },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityTime: { color: colors.textMuted, fontSize: 11 },
  activityText: { marginTop: 2, fontSize: 13 },
  activityMeta: { marginTop: 2, color: colors.textMuted, fontSize: 11 },
  label: { fontSize: 12, color: colors.textMuted },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 12 },
  routeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.base },
  routeText: { fontSize: 14, color: colors.text, marginTop: 2 },
  factsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  callButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
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
