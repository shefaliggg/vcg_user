import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import shipperProfileService from "../../services/shipperProfile.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

// Final onboarding step: shipper checks off the closing agreement (in place of a
// hand-drawn signature) and the application is submitted for mandatory admin review.
export default function ESignatureScreen({ navigation }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async () => {
    if (!agreed) {
      setErrorMessage("Please agree to the Terms & Conditions and Privacy Policy to continue.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      await shipperProfileService.submitApplication();
      navigation.reset({ index: 0, routes: [{ name: "UnderReview" }] });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={loading}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <AppText weight="bold" style={styles.headerText}>Step 8 of 8</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.subHeader}>
        <Feather name="check-square" size={16} color={colors.primary} />
        <AppText style={styles.subText}>Confirm your application, then submit for admin review</AppText>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.85}
          disabled={loading}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Feather name="check" size={14} color={colors.white} />}
          </View>
          <AppText style={styles.checkboxLabel}>
            I agree to CP Transport Terms &amp; Conditions and Privacy Policy.
          </AppText>
        </TouchableOpacity>

        {errorMessage && <AppText style={styles.errorText}>{errorMessage}</AppText>}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, (loading || !agreed) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading || !agreed}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <AppText variant="button" style={styles.buttonText}>Agree & Submit</AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#F1F5F9" },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: { fontSize: 16, color: colors.white },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    gap: 6,
  },
  subText: { fontSize: 13, color: colors.text, flex: 1 },
  card: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  errorText: { color: colors.error, marginTop: spacing.sm },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: "#F1F5F9",
  },
  confirmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.button,
  },
  buttonText: { color: colors.white, marginLeft: 6 },
});
