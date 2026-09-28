import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import authService from "../services/auth.service";
import AppText from "../components/AppText";
import FormInput from "../components/FormInput";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (value) => {
  if (!value.trim()) return "Required";
  if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
  return null;
};

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailChange = (value) => {
    setEmail(value);
    if (error && !validateEmail(value)) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const message = validateEmail(email);
    if (message) {
      setError(message);
      return;
    }
    setError(null);

    setLoading(true);
    try {
      await authService.forgotPassword({ email });

      navigation.navigate("ResetPassword", { email });
    } catch (e) {
      Alert.alert("Error", "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.primary }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="lock" size={26} color={colors.primary} />
            </View>

            <AppText variant="screenTitle" style={styles.title}>
              Forgot Password
            </AppText>

            <AppText style={styles.subtitle}>
              Enter your email to receive a reset OTP
            </AppText>
          </View>

          {/* Card */}
          <View style={styles.card}>

            <FormInput
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              value={email}
              onChangeText={handleEmailChange}
              error={error}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText variant="button" style={styles.buttonText}>
                  Send OTP
                </AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginTop: 16 }}
            >
              <AppText style={styles.backLink}>
                Back to login
              </AppText>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.huge,
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: 50,
    marginBottom: spacing.base,
  },
  title: {
    color: colors.white,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing.xs,
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    marginTop: spacing.xxxl,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    padding: spacing.xl,
    flex: 1,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: {
    color: colors.white,
  },
  backLink: {
    textAlign: "center",
    color: colors.primary,
  },
});