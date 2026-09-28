import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authService from "../../services/auth.service";
import AppText from "../../components/AppText";
import FormInput from "../../components/FormInput";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";

const PHONE_REGEX = /^[0-9()\-\s+]{7,}$/;

const validatePhone = (value) => {
  if (!value.trim()) return "Required";
  if (!PHONE_REGEX.test(value.trim())) return "Enter a valid phone number";
  return null;
};

export default function PhoneAuthScreen({ navigation, route }) {
  const intent = route.params?.intent || "signup";
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsUnavailable, setSmsUnavailable] = useState(false);
  const [error, setError] = useState(null);

  const handlePhoneChange = (value) => {
    setPhone(value);
    if (error && !validatePhone(value)) {
      setError(null);
    }
  };

  const handleContinue = async () => {
    const message = validatePhone(phone);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setLoading(true);
    setSmsUnavailable(false);
    try {
      const result = await authService.sendOtp("phone", phone.trim());
      if (result?.smsAvailable === false) {
        setSmsUnavailable(true);
      } else {
        navigation.navigate("VerifyCode", { channel: "phone", identifier: phone.trim(), intent });
      }
    } catch (err) {
      setSmsUnavailable(true);
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
          Enter your phone number
        </AppText>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.container}>
            <FormInput
              placeholder="(555) 555-5555"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              error={error}
              containerStyle={{ marginBottom: error ? spacing.sm : spacing.lg }}
              leftElement={<AppText style={styles.prefix}>🇺🇸 +1</AppText>}
            />

            {smsUnavailable && (
              <View style={styles.noticeBox}>
                <Feather name="info" size={16} color={colors.warning} />
                <AppText style={styles.noticeText}>
                  Phone sign-in isn't available yet — please continue with email.
                </AppText>
                <TouchableOpacity
                  onPress={() => navigation.replace("EmailAuth", { intent })}
                  style={styles.switchButton}
                >
                  <AppText weight="semiBold" style={{ color: colors.primary }}>
                    Switch to Email
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText variant="button" style={styles.buttonText}>
                  Continue
                </AppText>
              )}
            </TouchableOpacity>

            <AppText style={styles.hint}>We'll send you a verification code.</AppText>
          </View>
        </KeyboardAvoidingView>
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
  container: {
    padding: spacing.lg,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    height: 54,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefix: {
    marginRight: spacing.sm,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.text,
  },
  noticeBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  noticeText: {
    marginTop: spacing.xs,
    color: "#92400E",
    fontSize: 13,
  },
  switchButton: {
    marginTop: spacing.sm,
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
  hint: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.base,
  },
});
