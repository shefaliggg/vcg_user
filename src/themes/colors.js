export const colors = {
  primary: "#1D4ED8",
  primaryDark: "#1E3A8A",
  primaryLight: "#EFF6FF",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  error: "#DC2626",
  info: "#0284C7",
  white: "#FFFFFF",

  // status colors — same across Admin, Shipper, Driver
  statusSuccess: "#16A34A",
  statusWarning: "#D97706",
  statusError: "#DC2626",
  statusPending: "#D97706",
  statusCompleted: "#16A34A",
  statusCancelled: "#DC2626",
  statusActive: "#1D4ED8", // "Info/Active" status — reads as primary brand blue
  statusNeutral: "#64748B",

  // legacy aliases — kept so any remaining consumers of the old gradient tokens
  // still resolve to the current brand primary instead of breaking
  primarySoft: "#EFF6FF",
  gradientStart: "#1D4ED8",
  gradientEnd: "#1D4ED8",
};
