import React, { useState } from "react";
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
import shipperProfileService from "../../services/shipperProfile.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import FormInput from "../../components/FormInput";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

const PAYMENT_TERMS = [
  { key: "due_on_receipt", label: "Due on Receipt" },
  { key: "net_15", label: "Net 15" },
  { key: "net_30", label: "Net 30" },
  { key: "net_45", label: "Net 45" },
];

const PAYMENT_METHODS = [
  { key: "ach", label: "ACH / Bank Transfer" },
  { key: "check", label: "Check" },
  { key: "credit_card", label: "Credit Card" },
];

export default function BillingInformationScreen({ navigation }) {
  const [formData, setFormData] = useState({ contactName: "", email: "", phone: "", paymentTerms: "", preferredPaymentMethod: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const validators = {
    contactName: (v) => (!v.trim() ? "Required" : null),
    email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : null),
    phone: (v) => (!v.trim() ? "Required" : null),
    paymentTerms: (v) => (!v ? "Select payment terms" : null),
    preferredPaymentMethod: (v) => (!v ? "Select a payment method" : null),
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] && !validators[field](value)) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleContinue = async () => {
    const nextErrors = {};
    Object.keys(validators).forEach((field) => {
      const message = validators[field](formData[field]);
      if (message) nextErrors[field] = message;
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setServerError(null);
    setLoading(true);
    try {
      await shipperProfileService.saveBillingInfo(formData);
      navigation.navigate("RequiredDocuments");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.progress}>
            <AppText style={styles.progressText}>Step 5 of 8</AppText>
            <AppText variant="screenTitle" style={styles.title}>Billing Information</AppText>
            <AppText style={styles.subtitle}>Who should we invoice, and how do you want to pay?</AppText>
          </View>

          <View style={styles.card}>
            <FormInput
              label="Billing Contact Name"
              placeholder="Jane Doe"
              value={formData.contactName}
              onChangeText={(v) => handleChange("contactName", v)}
              error={errors.contactName}
            />
            <FormInput
              label="Billing Email"
              placeholder="billing@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(v) => handleChange("email", v)}
              error={errors.email}
            />
            <FormInput
              label="Billing Phone"
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(v) => handleChange("phone", v)}
              error={errors.phone}
            />

            <AppText variant="label" style={styles.label}>Payment Terms</AppText>
            <View style={styles.chipRow}>
              {PAYMENT_TERMS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, formData.paymentTerms === opt.key && styles.chipActive]}
                  onPress={() => handleChange("paymentTerms", opt.key)}
                >
                  <AppText weight="semiBold" style={[styles.chipText, formData.paymentTerms === opt.key && styles.chipTextActive]}>
                    {opt.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            {!!errors.paymentTerms && <AppText style={styles.errorText}>{errors.paymentTerms}</AppText>}

            <AppText variant="label" style={[styles.label, { marginTop: spacing.base }]}>Preferred Payment Method</AppText>
            {PAYMENT_METHODS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={styles.radioRow}
                onPress={() => handleChange("preferredPaymentMethod", opt.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, formData.preferredPaymentMethod === opt.key && styles.radioActive]}>
                  {formData.preferredPaymentMethod === opt.key && <View style={styles.radioDot} />}
                </View>
                <AppText style={styles.radioLabel}>{opt.label}</AppText>
              </TouchableOpacity>
            ))}
            {!!errors.preferredPaymentMethod && <AppText style={styles.errorText}>{errors.preferredPaymentMethod}</AppText>}

            {serverError && <AppText style={styles.errorText}>{serverError}</AppText>}

            <TouchableOpacity style={[styles.button, { marginTop: spacing.lg }]} onPress={handleContinue} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText variant="button" style={styles.buttonText}>Continue</AppText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
  progress: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  progressText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: { color: colors.white, marginBottom: spacing.xs },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    marginTop: -20,
    marginHorizontal: spacing.lg,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  label: { marginBottom: spacing.sm, color: colors.text },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.white },
  radioRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  radioLabel: { color: colors.text, fontSize: 14 },
  errorText: { color: colors.error, marginTop: spacing.xs, fontSize: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  buttonText: { color: colors.white },
});
