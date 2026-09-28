import React from "react";
import { View, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";

// Passwordless entry (same as CP Driver): pick phone or email, get a one-time
// code. Both buttons run the same OTP flow - an existing account is logged in,
// a new one continues into onboarding. The route stays named "Login" because
// logout / session-expiry redirects throughout the app target it.
export default function LoginScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.primary }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.screen}>
        <View style={styles.header}>
          <Feather name="truck" size={48} color={colors.white} />
          <AppText variant="screenTitle" style={styles.title}>Welcome to CP</AppText>
          <AppText variant="body" style={styles.subtitle}>
            Book reliable trucks and drivers for your shipments.
          </AppText>
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("ChooseAuthMethod", { intent: "signup" })}
          >
            <AppText variant="button" style={styles.primaryText}>Create Shipper Account</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("ChooseAuthMethod", { intent: "login" })}
          >
            <AppText variant="button" style={styles.secondaryText}>Log In</AppText>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "space-between",
  },
  header: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.white,
    marginTop: spacing.lg,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  footer: {
    padding: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.white,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.button,
    marginBottom: spacing.md,
  },
  primaryText: {
    color: colors.primary,
  },
  secondaryButton: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
});
