import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import AppText from "./AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";

/**
 * Date / time field that looks like FormInput and opens a real picker.
 *
 * Values are plain strings so they can go straight into the booking payload:
 *   mode="date" -> "MM/DD/YYYY"      mode="time" -> "h:mm AM/PM"
 *
 * @react-native-community/datetimepicker has no web implementation (it renders
 * nothing), so on web this renders a native <input type="date|time"> instead.
 */
const pad = (n) => String(n).padStart(2, "0");

export const formatDate = (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
export const formatTime = (d) => {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
};

const parseDate = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
  return m ? new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2])) : null;
};
const parseTime = (s) => {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(s || "");
  if (!m) return null;
  const d = new Date();
  d.setHours((Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0), Number(m[2]), 0, 0);
  return d;
};

// <input type="date|time"> speaks "YYYY-MM-DD" / "HH:mm"
const toInput = (mode, s) => {
  const d = mode === "date" ? parseDate(s) : parseTime(s);
  if (!d) return "";
  return mode === "date"
    ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromInput = (mode, v) => {
  if (!v) return "";
  if (mode === "date") {
    const [y, m, d] = v.split("-").map(Number);
    return formatDate(new Date(y, m - 1, d));
  }
  const [h, min] = v.split(":").map(Number);
  const d = new Date();
  d.setHours(h, min, 0, 0);
  return formatTime(d);
};

export default function DateTimeField({ label, value, onChange, mode = "date", required, error, minimumDate, containerStyle, placeholder }) {
  const [open, setOpen] = useState(false);
  const borderColor = error ? colors.error : colors.border;
  const icon = mode === "date" ? "calendar" : "clock";

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
          {required ? <AppText style={styles.required}> *</AppText> : null}
        </AppText>
      ) : null}

      {Platform.OS === "web" ? (
        <View style={[styles.field, { borderColor }]}>
          <Feather name={icon} size={16} color={colors.primary} />
          <input
            type={mode}
            value={toInput(mode, value)}
            min={mode === "date" && minimumDate ? toInput("date", formatDate(minimumDate)) : undefined}
            onChange={(e) => onChange(fromInput(mode, e.target.value))}
            style={webInput}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity style={[styles.field, { borderColor }]} onPress={() => setOpen(true)} activeOpacity={0.7}>
            <Feather name={icon} size={16} color={colors.primary} />
            <AppText style={[styles.value, !value && { color: colors.textMuted }]}>
              {value || placeholder || (mode === "date" ? "Select date" : "Select time")}
            </AppText>
          </TouchableOpacity>
          {open && (
            <DateTimePicker
              value={(mode === "date" ? parseDate(value) : parseTime(value)) || minimumDate || new Date()}
              mode={mode}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={mode === "date" ? minimumDate : undefined}
              onChange={(event, picked) => {
                // Android closes itself; iOS spinner stays until the user taps elsewhere.
                if (Platform.OS !== "ios") setOpen(false);
                if (event?.type === "dismissed") return setOpen(false);
                if (picked) onChange(mode === "date" ? formatDate(picked) : formatTime(picked));
              }}
            />
          )}
          {open && Platform.OS === "ios" && (
            <TouchableOpacity style={styles.done} onPress={() => setOpen(false)}>
              <AppText weight="semiBold" style={{ color: colors.primary }}>Done</AppText>
            </TouchableOpacity>
          )}
        </>
      )}

      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

// Plain DOM style - <input> is a raw web element, not an RN View.
const webInput = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 15,
  color: colors.text,
  height: "100%",
  cursor: "pointer",
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: { marginBottom: spacing.sm, color: colors.text },
  required: { color: colors.error },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 50,
    paddingHorizontal: spacing.base,
    borderRadius: radius.input,
    borderWidth: 1,
    backgroundColor: colors.background,
  },
  value: { fontSize: 15, color: colors.text },
  error: { color: colors.error, fontSize: 12, marginTop: spacing.xs },
  done: { alignSelf: "flex-end", paddingVertical: spacing.sm },
});
