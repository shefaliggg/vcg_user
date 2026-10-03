import { colors } from "../themes/colors";

// Shipper-facing stage of a load, derived from Booking.status, the quote list and
// the rate-confirmation state. Drives the My Loads badge and the Load Details header.
export const quoteCountOf = (b) => (Array.isArray(b?.quotations) ? b.quotations.length : 0);

export const getLoadStage = (b) => {
  if (b?.isDraft) {
    return { key: "draft", label: "Draft", color: colors.textMuted, needsAction: false };
  }

  const status = String(b?.status || "").toUpperCase();
  const rc = b?.rateConfirmation?.status;
  const n = quoteCountOf(b);

  if (status === "PENDING_APPROVAL") {
    return { key: "pending_review", label: "Pending Admin Review", color: colors.statusPending, needsAction: false };
  }
  if (status === "REJECTED") {
    return { key: "rejected", label: "Changes Requested", color: colors.statusCancelled, needsAction: true };
  }
  if (status === "DELIVERED" || status === "COMPLETED") {
    return { key: "delivered", label: "Delivered", color: colors.textMuted, needsAction: false };
  }
  if (status === "IN_PROGRESS") {
    return { key: "in_transit", label: "In Transit", color: colors.success, needsAction: false };
  }
  if (status === "ACCEPTED" || (status === "CONFIRMED" && ["carrier_acknowledged", "driver_accepted"].includes(rc))) {
    return { key: "assigned", label: "Assigned", color: colors.success, needsAction: false };
  }
  if (status === "CONFIRMED") {
    if (rc === "awaiting_admin_approval") {
      return { key: "quote_accepted", label: "Quote Accepted · VCG Review", color: colors.statusActive, needsAction: false };
    }
    if (["awaiting_carrier_acknowledgment", "awaiting_user_signature", "user_signed"].includes(rc)) {
      return { key: "quote_accepted", label: "Awaiting Carrier Acknowledgment", color: colors.statusWarning, needsAction: false };
    }
    return {
      key: "quote_accepted",
      label: "Quote Accepted",
      color: colors.statusActive,
      needsAction: false,
    };
  }

  // OPEN_FOR_QUOTES
  if (n > 0) {
    return {
      key: "bidding",
      label: `Bidding · ${n} Quote${n === 1 ? "" : "s"}`,
      color: colors.statusWarning,
      needsAction: true,
    };
  }
  return { key: "bidding_empty", label: "Bidding · No Quotes", color: colors.statusNeutral, needsAction: false };
};

// Trip.status-driven progress tracker for the shipper's Load Details page.
// Mirrors vcg_driverr/src/constants/tripStatus.js's TIMELINE_STEPS so the same
// load reads as the same stage on both apps - kept as a separate copy since the
// two apps are independent RN projects with no shared package.
export const TRIP_TIMELINE_STEPS = [
  { key: "assigned", label: "Load Posted", statuses: [] },
  { key: "driver_assigned", label: "Driver Assigned", statuses: ["assigned", "accepted"] },
  { key: "picked_up", label: "Picked Up", statuses: ["going_to_pickup", "arrived_at_pickup", "loading", "loaded"] },
  { key: "in_transit", label: "In Transit", statuses: ["in_transit", "arrived_at_drop"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered", "completed", "pod_uploaded", "pod_approved"] },
];

export const currentTripTimelineIndex = (tripStatus) => {
  if (!tripStatus) return 0;
  const idx = TRIP_TIMELINE_STEPS.findIndex((step) => step.statuses.includes(tripStatus));
  return idx === -1 ? 0 : idx;
};

export const timeAgo = (date) => {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
