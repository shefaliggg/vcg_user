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

  if (status === "DELIVERED" || status === "COMPLETED") {
    return { key: "delivered", label: "Delivered", color: colors.textMuted, needsAction: false };
  }
  if (status === "IN_PROGRESS") {
    return { key: "in_transit", label: "In Transit", color: colors.success, needsAction: false };
  }
  if (status === "ACCEPTED" || (status === "CONFIRMED" && rc === "driver_accepted")) {
    return { key: "assigned", label: "Assigned", color: colors.success, needsAction: false };
  }
  if (status === "CONFIRMED") {
    return {
      key: "quote_accepted",
      label: "Quote Accepted",
      color: colors.statusActive,
      needsAction: rc === "awaiting_user_signature",
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
