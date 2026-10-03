import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authService from "../../services/auth.service";
import getErrorMessage from "../../utils/errorHandler";
import { registerForPushNotifications } from "../../services/push.service";
import { routeForShipperStep } from "../../navigation/onboardingSteps";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyCodeScreen({ navigation, route }) {
  const { channel, identifier } = route.params;
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputs = useRef([]);

  const code = digits.join("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleChangeDigit = (value, index) => {
    const next = [...digits];
    next[index] = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits(next);
    setErrorMessage(null);
    if (value && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setErrorMessage(null);
    try {
      await authService.sendOtp(channel, identifier);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setErrorMessage("Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await authService.verifyOtp(channel, identifier, code);
      setVerified(true);
      registerForPushNotifications().catch((error) => {
        console.warn("Push notification registration failed:", error?.message);
      });

      setTimeout(() => {
        const isNewUser = result.isNewUser;
        const step = result.shipper?.shipperOnboardingStep;
        const approvalStatus = result.shipper?.shipperApprovalStatus;
        if (step === "submitted") {
          navigation.replace(approvalStatus === "approved" ? "Home" : "UnderReview");
        } else if (isNewUser || (step && step !== "complete")) {
          navigation.replace(routeForShipperStep(step || "your_info"), { channel, identifier });
        } else {
          navigation.replace("Home");
        }
      }, 600);
    } catch (err) {
      const serverMessage = err.response?.data?.message || "";
      let message;
      if (/expired|not requested/i.test(serverMessage)) {
        message = "This code has expired. Request a new code.";
      } else if (err.response?.status === 400) {
        message = "That code isn't correct. Try again.";
      } else {
        message = getErrorMessage(err);
      }
      setErrorMessage(message);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.primary }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.white} />
        </TouchableOpacity>
        <AppText variant="screenTitle" style={styles.title}>
          Verify your account
        </AppText>
        <AppText style={styles.subtitle}>
          Enter the 6-digit code we sent to {identifier}
        </AppText>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.container}>
          {verified ? (
            <View style={styles.verifiedBox}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <AppText weight="semiBold" style={styles.verifiedText}>Verified</AppText>
            </View>
          ) : (
            <>
              <View style={styles.codeRow}>
                {digits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputs.current[index] = ref)}
                    style={[styles.codeBox, errorMessage && styles.codeBoxError]}
                    value={digit}
                    onChangeText={(v) => handleChangeDigit(v, index)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                        inputs.current[index - 1]?.focus();
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>

              {errorMessage && (
                <AppText style={styles.errorText}>{errorMessage}</AppText>
              )}

              <TouchableOpacity
                style={[styles.button, code.length !== CODE_LENGTH && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading || code.length !== CODE_LENGTH}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <AppText variant="button" style={styles.buttonText}>
                    Verify
                  </AppText>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <TouchableOpacity onPress={handleResend} disabled={resending || cooldown > 0} style={styles.resendButton}>
                  <AppText weight="semiBold" style={{ color: cooldown > 0 ? colors.textMuted : colors.primary }}>
                    {resending ? "Resending..." : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend Code"}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.resendButton}>
                  <AppText weight="semiBold" style={{ color: colors.primary }}>
                    Change Phone / Email
                  </AppText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing.xs,
  },
  container: {
    padding: spacing.lg,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontSize: 20,
    color: colors.text,
  },
  codeBoxError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.base,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.button,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  resendButton: {
    alignItems: "center",
  },
  verifiedBox: {
    alignItems: "center",
    marginTop: spacing.xxxl,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 18,
    marginTop: spacing.sm,
  },
});
