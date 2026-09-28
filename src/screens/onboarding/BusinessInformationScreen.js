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
import shipperProfileService from "../../services/shipperProfile.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import FormInput from "../../components/FormInput";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9()\-\s+]{7,}$/;

export default function BusinessInformationScreen({ navigation }) {
  const [formData, setFormData] = useState({
    companyName: "",
    billingAddress: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const validators = {
    companyName: (v) => (!v.trim() ? "Required" : null),
    billingAddress: (v) => (!v.trim() ? "Required" : null),
    city: (v) => (!v.trim() ? "Required" : null),
    state: (v) => (!v.trim() ? "Required" : null),
    zip: (v) => (!v.trim() ? "Required" : null),
    phone: (v) => {
      if (!v.trim()) return null; // optional field
      if (!PHONE_REGEX.test(v.trim())) return "Enter a valid phone number";
      return null;
    },
    email: (v) => {
      if (!v.trim()) return null; // optional field
      if (!EMAIL_REGEX.test(v.trim())) return "Enter a valid email address";
      return null;
    },
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
      await shipperProfileService.saveBusinessInfo(formData);
      navigation.navigate("PrimaryLocation");
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
            <AppText style={styles.progressText}>Step 3 of 8</AppText>
            <AppText variant="screenTitle" style={styles.title}>Business Information</AppText>
            <AppText style={styles.subtitle}>Only shown for Business accounts.</AppText>
          </View>

          <View style={styles.card}>
            <FormInput
              label="Business / Company Name"
              placeholder="ABC Logistics LLC"
              value={formData.companyName}
              onChangeText={(v) => handleChange("companyName", v)}
              error={errors.companyName}
            />

            <FormInput
              label="Business Address"
              placeholder="123 Main St"
              value={formData.billingAddress}
              onChangeText={(v) => handleChange("billingAddress", v)}
              error={errors.billingAddress}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <FormInput
                label="City"
                placeholder="Dallas"
                value={formData.city}
                onChangeText={(v) => handleChange("city", v)}
                error={errors.city}
                containerStyle={{ flex: 1.4 }}
              />
              <FormInput
                label="State"
                placeholder="TX"
                autoCapitalize="characters"
                maxLength={2}
                value={formData.state}
                onChangeText={(v) => handleChange("state", v)}
                error={errors.state}
                containerStyle={{ flex: 1 }}
              />
              <FormInput
                label="ZIP"
                placeholder="75201"
                keyboardType="number-pad"
                maxLength={5}
                value={formData.zip}
                onChangeText={(v) => handleChange("zip", v)}
                error={errors.zip}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <FormInput
              label="Business Phone (optional)"
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(v) => handleChange("phone", v)}
              error={errors.phone}
            />

            <FormInput
              label="Business Email (optional)"
              placeholder="billing@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(v) => handleChange("email", v)}
              error={errors.email}
            />

            <AppText style={styles.hint}>
              No EIN or tax ID needed here — we'll only ask for that later if billing requires it.
            </AppText>

            {serverError && <AppText style={styles.errorText}>{serverError}</AppText>}

            <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
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
  title: {
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
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
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    fontSize: 15,
    color: colors.text,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.base,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.white,
  },
});
