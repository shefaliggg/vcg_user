import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import shipperProfileService from "../../services/shipperProfile.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

const AGREEMENTS = [
  { key: "tos", label: "CP Terms of Service" },
  { key: "privacyPolicy", label: "Privacy Policy" },
  { key: "shipperAgreement", label: "Shipper Agreement" },
];

export default function TermsAgreementsScreen({ navigation }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleContinue = async () => {
    if (!accepted) {
      setErrorMessage("Please accept the agreement to continue.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      await shipperProfileService.acceptTerms();
      navigation.navigate("ESignature");
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <AppText style={styles.progressText}>Step 7 of 8</AppText>
          <AppText variant="screenTitle" style={styles.title}>Shipper Agreement</AppText>
        </View>

        <View style={styles.card}>
          {AGREEMENTS.map((item) => (
            <View key={item.key} style={styles.agreementRow}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <AppText style={styles.agreementText}>{item.label}</AppText>
            </View>
          ))}

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <Feather name="check" size={14} color={colors.white} />}
            </View>
            <AppText style={styles.checkboxLabel}>
              I agree to the CP Terms of Service, Privacy Policy, and Shipper Agreement.
            </AppText>
          </TouchableOpacity>

          {errorMessage && <AppText style={styles.errorText}>{errorMessage}</AppText>}

          <TouchableOpacity
            style={[styles.button, !accepted && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading || !accepted}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText variant="button" style={styles.buttonText}>Agree & Continue</AppText>
            )}
          </TouchableOpacity>

          <AppText style={styles.hint}>Next: sign your application before it goes to admin for review.</AppText>
        </View>
      </ScrollView>
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
  agreementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  agreementText: {
    marginLeft: spacing.sm,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.base,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
  },
  hint: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.base,
  },
});
