import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { showAlert } from "../../utils/alert";
import authService from "../../services/auth.service";
import shipperProfileService from "../../services/shipperProfile.service";
import { routeForShipperStep } from "../../navigation/onboardingSteps";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

const POLL_MS = 15000;

// Mandatory admin verification gate for CP Shipper (US) onboarding — mirrors the
// driver app's PendingApprovalScreen, adapted to vcg_user's plain AsyncStorage auth
// (no redux profile slice here, so this screen polls shipperProfileService itself).
export default function UnderReviewScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const intervalRef = useRef(null);

  const checkStatus = async () => {
    try {
      const data = await shipperProfileService.getStatus();
      setProfile(data);
      if (data?.shipperApprovalStatus === "approved") {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (err) {
      console.log("[UnderReview] status check failed", err?.message);
    }
  };

  useEffect(() => {
    checkStatus();
    intervalRef.current = setInterval(checkStatus, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  const isRejected = profile?.shipperApprovalStatus === "rejected";

  const handleReapply = () => {
    navigation.replace(routeForShipperStep(profile?.shipperOnboardingStep || "your_info"));
  };

  const handleLogout = () => {
    showAlert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.primary }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <AppText variant="screenTitle" style={styles.headerTitle}>Account Status</AppText>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Feather
                name={isRejected ? "x-circle" : "clock"}
                size={60}
                color={isRejected ? colors.error : colors.warning}
              />
            </View>

            <AppText weight="bold" style={styles.title}>
              {isRejected ? "Application Rejected" : "Under Admin Review"}
            </AppText>

            <AppText style={styles.subtitle}>
              {isRejected
                ? "Your shipper application was rejected by admin."
                : "Your application has been submitted. Our admin team is reviewing your documents and information."}
            </AppText>

            <View style={styles.statusBox}>
              <AppText style={styles.label}>Name</AppText>
              <AppText weight="semiBold" style={styles.value}>
                {profile?.firstName} {profile?.lastName}
              </AppText>

              <AppText style={[styles.label, { marginTop: spacing.md }]}>Email</AppText>
              <AppText weight="semiBold" style={styles.value}>{profile?.email}</AppText>

              <AppText style={[styles.label, { marginTop: spacing.md }]}>Status</AppText>
              <View style={styles.statusRow}>
                <Feather name={isRejected ? "x-circle" : "clock"} size={14} color={isRejected ? colors.error : colors.warning} />
                <AppText weight="bold" style={[styles.value, styles.statusRowText, { color: isRejected ? colors.error : colors.warning }]}>
                  {isRejected ? "Rejected" : "Pending Approval"}
                </AppText>
              </View>
            </View>

            {isRejected && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleReapply}>
                <AppText variant="button" style={styles.primaryText}>Reapply</AppText>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Feather name="log-out" size={16} color={colors.error} />
              <AppText weight="semiBold" style={styles.logoutText}>Logout</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, alignItems: "center", backgroundColor: colors.primary },
  headerTitle: { color: colors.white },
  container: { flex: 1, justifyContent: "center", padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconContainer: { alignItems: "center", marginBottom: spacing.lg },
  title: { fontSize: 20, textAlign: "center" },
  subtitle: { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  statusBox: { backgroundColor: colors.background, padding: spacing.base, borderRadius: radius.input, marginBottom: spacing.lg },
  label: { color: colors.textMuted, fontSize: 12 },
  value: { fontSize: 15, marginTop: spacing.xs },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.xs, gap: spacing.xs },
  statusRowText: { marginTop: 0 },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.button,
    marginBottom: spacing.md,
  },
  primaryText: { color: colors.white },
  logoutButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", padding: spacing.md, gap: spacing.xs },
  logoutText: { color: colors.error },
});
