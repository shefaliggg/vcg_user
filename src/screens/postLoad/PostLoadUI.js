import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_MAPS_API_KEY } from "../../utils/googleMaps";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";
import { POST_LOAD_STEPS } from "./PostLoadContext";

export const PACKAGE_TYPES = ["Pallets", "Boxes", "Crates", "Other"];
export const EQUIPMENT_TYPES = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Other"];
export const LOADING_TYPES = [
  { value: "live_load", label: "Live Load" },
  { value: "drop_hook", label: "Drop & Hook" },
];
export const UNLOADING_TYPES = [
  { value: "live_unload", label: "Live Unload" },
  { value: "drop_hook", label: "Drop & Hook" },
];

// "123 Main St, Chicago, IL 60601, USA" -> "Chicago, IL"
export function cityState(address) {
  if (!address) return "—";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 3) return `${parts[parts.length - 3]}, ${parts[parts.length - 2].split(" ")[0]}`;
  return address;
}

export function scheduleLine(date, time, windowStart, windowEnd) {
  const when = windowStart && windowEnd ? `${windowStart}–${windowEnd}` : time;
  return [date, when].filter(Boolean).join(" · ") || "—";
}

/**
 * Page chrome shared by every step. The header matches the dashboard's AppHeader:
 * a slim white bar (safe-area inset + 60px row) with a thin progress line under it.
 */
export function StepShell({ step, title, subtitle, onBack, children, footer, error }) {
  const total = POST_LOAD_STEPS.length;
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>{title}</AppText>
          <AppText style={styles.stepCount}>Step {step} of {total}</AppText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {!!subtitle && <AppText style={styles.subtitle}>{subtitle}</AppText>}
          {children}
          {!!error && <AppText style={styles.serverError}>{error}</AppText>}
          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Continue button + "Save draft" link. */
export function StepFooter({ onContinue, continueLabel = "Continue", onSaveDraft, savingDraft, disabled }) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.primaryButton} onPress={onContinue} disabled={disabled}>
        <AppText variant="button" style={styles.primaryButtonText}>{continueLabel}</AppText>
        <Feather name="chevron-right" size={18} color={colors.white} />
      </TouchableOpacity>
      {onSaveDraft && (
        <TouchableOpacity style={styles.linkButton} onPress={onSaveDraft} disabled={savingDraft || disabled}>
          {savingDraft ? <ActivityIndicator color={colors.primary} /> : (
            <AppText weight="semiBold" style={styles.linkText}>Save as draft</AppText>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SectionCard({ title, subtitle, children }) {
  return (
    <View style={styles.card}>
      {!!title && <AppText variant="sectionTitle" style={styles.cardTitle}>{title}</AppText>}
      {!!subtitle && <AppText style={styles.hint}>{subtitle}</AppText>}
      {children}
    </View>
  );
}

export function YesNoToggle({ label, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <AppText style={styles.toggleLabel}>{label}</AppText>
      <View style={styles.toggleButtons}>
        {[true, false].map((v) => (
          <TouchableOpacity key={String(v)} style={[styles.toggleButton, value === v && styles.toggleButtonActive]} onPress={() => onChange(v)}>
            <AppText weight="semiBold" style={[styles.toggleButtonText, value === v && styles.toggleButtonTextActive]}>{v ? "Yes" : "No"}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export function ChipRow({ options, selected, onSelect, isObjectOptions }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const value = isObjectOptions ? opt.value : opt;
        const label = isObjectOptions ? opt.label : opt;
        const active = selected === value;
        return (
          <TouchableOpacity key={value} style={[styles.chip, active && styles.chipActive]} onPress={() => onSelect(value)}>
            <AppText weight="semiBold" style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// react-native-google-places-autocomplete throws on web (it reads a const before it is
// initialised), so on web load the Google Maps JS Places API directly and attach its
// Autocomplete to a plain <input>.
let mapsPromise = null;
const loadGoogleMaps = () => {
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
};

function WebAddressInput({ placeholder, value, onSelect, hasError }) {
  const inputRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const ac = new google.maps.places.Autocomplete(inputRef.current, { fields: ["formatted_address", "geometry", "name"] });
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          if (p?.geometry) {
            onSelectRef.current({ address: p.formatted_address || p.name, lat: p.geometry.location.lat(), lng: p.geometry.location.lng() });
          }
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <input
      ref={inputRef}
      defaultValue={value?.address || ""}
      placeholder={placeholder}
      style={{
        width: "100%",
        boxSizing: "border-box",
        height: 50,
        padding: "0 16px",
        fontSize: 15,
        color: colors.text,
        backgroundColor: colors.background,
        border: `1px solid ${hasError ? colors.error : colors.border}`,
        borderRadius: radius.input,
        outline: "none",
      }}
    />
  );
}

/** Google Places search box with the chosen address confirmed underneath. */
export function AddressField({ label, placeholder, value, onSelect, error }) {
  return (
    <View style={styles.addressWrap}>
      <AppText variant="label" style={styles.fieldLabel}>{label}<AppText style={styles.required}> *</AppText></AppText>
      {Platform.OS === "web" ? (
        <WebAddressInput placeholder={placeholder} value={value} onSelect={onSelect} hasError={!!error} />
      ) : (
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        fetchDetails
        onPress={(data, details = null) => {
          if (!details) return;
          onSelect({
            address: details.formatted_address || data.description,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
          });
        }}
        query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
        enablePoweredByContainer={false}
        styles={{ textInput: [styles.addressInput, !!error && { borderColor: colors.error }], container: styles.autocompleteContainer, listView: styles.autocompleteList }}
        debounce={200}
      />
      )}
      {!!value?.address && (
        <View style={styles.selectedRow}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <AppText style={styles.selectedAddress} numberOfLines={2}>{value.address}</AppText>
        </View>
      )}
      {!!error && <AppText style={styles.errorText}>{error}</AppText>}
    </View>
  );
}

export function DocCard({ label, doc, uploading, onUpload, onPhoto }) {
  return (
    <View style={styles.docCard}>
      <View style={styles.docCardHeader}>
        <Feather name="file-text" size={18} color={doc ? colors.success : colors.textMuted} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <AppText weight="semiBold" style={styles.docCardLabel}>{label}</AppText>
          <AppText style={styles.docCardStatus}>{uploading ? "Uploading…" : doc ? doc.fileName : "Not uploaded"}</AppText>
        </View>
        {doc && !uploading && <Feather name="check-circle" size={16} color={colors.success} />}
      </View>
      <View style={styles.docButtonsRow}>
        <TouchableOpacity style={styles.docButton} onPress={onUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color={colors.primary} /> : (
            <>
              <Feather name="upload" size={16} color={colors.primary} />
              <AppText weight="semiBold" style={styles.docButtonText}>{doc ? "Replace" : "Upload from Device"}</AppText>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.docButton} onPress={onPhoto} disabled={uploading}>
          <Feather name="camera" size={16} color={colors.primary} />
          <AppText weight="semiBold" style={styles.docButtonText}>Take Photo</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Review section: a titled card with an Edit shortcut back to that step. */
export function ReviewSection({ title, onEdit, rows }) {
  return (
    <View style={styles.card}>
      <View style={styles.reviewHeader}>
        <AppText variant="sectionTitle" style={styles.cardTitleInline}>{title}</AppText>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Feather name="edit-2" size={13} color={colors.primary} />
            <AppText weight="semiBold" style={styles.linkText}>Edit</AppText>
          </TouchableOpacity>
        )}
      </View>
      {rows.map(([label, value], i) => (
        <View key={label} style={[styles.reviewRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
          <AppText style={styles.reviewLabel}>{label}</AppText>
          <AppText weight="semiBold" style={styles.reviewValue}>{value}</AppText>
        </View>
      ))}
    </View>
  );
}

export const shared = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  third: { flex: 1 },
  textArea: { height: 90, textAlignVertical: "top" },
  label: { marginBottom: spacing.sm, color: colors.text },
  errorText: { color: colors.error, fontSize: 12, marginTop: spacing.xs, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
  },
  backButton: { marginRight: spacing.md, padding: 2 },
  headerTitle: { flex: 1, fontSize: 17, color: colors.text },
  stepCount: { fontSize: 12, color: colors.textMuted },
  progressTrack: { height: 3, backgroundColor: colors.border },
  progressFill: { height: "100%", backgroundColor: colors.primary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.base },
  body: { paddingTop: spacing.base, paddingHorizontal: spacing.base },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: { color: colors.text, marginBottom: spacing.base },
  cardTitleInline: { color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.base },
  serverError: { color: colors.error, textAlign: "center", marginBottom: spacing.md },
  footer: { marginTop: spacing.xs },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
  },
  primaryButtonText: { color: colors.white },
  linkButton: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.xs },
  linkText: { color: colors.primary },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  toggleLabel: { fontSize: 14, color: colors.text, flex: 1 },
  toggleButtons: { flexDirection: "row", gap: spacing.sm },
  toggleButton: { paddingHorizontal: spacing.base, paddingVertical: spacing.xs, borderRadius: radius.button, borderWidth: 1, borderColor: colors.border },
  toggleButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleButtonText: { fontSize: 13, color: colors.textMuted },
  toggleButtonTextActive: { color: colors.white },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  addressWrap: { marginBottom: spacing.base, zIndex: 10 },
  fieldLabel: { marginBottom: spacing.sm, color: colors.text },
  required: { color: colors.error },
  addressInput: {
    backgroundColor: colors.background,
    borderRadius: radius.input,
    height: 50,
    paddingHorizontal: spacing.base,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  autocompleteContainer: { flex: 0 },
  autocompleteList: { backgroundColor: colors.surface },
  selectedRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  selectedAddress: { flex: 1, fontSize: 12, color: colors.success },
  errorText: { color: colors.error, fontSize: 12, marginTop: spacing.xs },
  docCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.base, marginBottom: spacing.base },
  docCardHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  docCardLabel: { fontSize: 14, color: colors.text },
  docCardStatus: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  docButtonsRow: { flexDirection: "row", gap: spacing.sm },
  docButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  docButtonText: { fontSize: 12, color: colors.primary },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  editButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  reviewRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  reviewValue: { fontSize: 14, color: colors.text },
});
