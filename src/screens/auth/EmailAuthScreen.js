import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authService from "../../services/auth.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function EmailAuthScreen({ navigation, route }) {
  const intent = route.params?.intent || "signup";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleContinue = async () => {
    if (!isValidEmail(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      await authService.sendOtp("email", email.trim());
      navigation.navigate("VerifyCode", { channel: "email", identifier: email.trim(), intent });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
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
          Enter your email
        </AppText>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.container}>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="name@company.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {errorMessage && (
              <AppText style={styles.errorText}>{errorMessage}</AppText>
            )}

            <TouchableOpacity
              style={[styles.button, !email.trim() && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={loading || !email.trim()}
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
  input: {
    flex: 1,
    height: "100%",
    marginLeft: spacing.sm,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.base,
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
