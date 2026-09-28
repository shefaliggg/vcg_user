import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import authService from "../services/auth.service";
import getErrorMessage from "../utils/errorHandler";
import { Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import FormInput from "../components/FormInput";
import { fonts, textStyles } from "../themes/typography";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";
import { shadows } from "../themes/shadows";
const { width } = Dimensions.get('window');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9()\-\s+]{7,}$/;

export default function RegisterScreen({ navigation }) {

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    countryCode: "+1",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validators = {
    firstName: (v) => (!v.trim() ? "Required" : null),
    lastName: (v) => (!v.trim() ? "Required" : null),
    email: (v) => {
      if (!v.trim()) return "Required";
      if (!EMAIL_REGEX.test(v.trim())) return "Enter a valid email address";
      return null;
    },
    phone: (v) => {
      if (!v.trim()) return "Required";
      if (!PHONE_REGEX.test(v.trim())) return "Enter a valid phone number";
      return null;
    },
    password: (v) => {
      if (!v) return "Required";
      if (v.length < 6) return "Must be at least 6 characters";
      return null;
    },
    confirmPassword: (v, data) => {
      if (!v) return "Required";
      if (v !== data.password) return "Passwords do not match";
      return null;
    },
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (errors[field] && !validators[field](value, next)) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: undefined }));
      }
      // Re-validate confirmPassword live when password changes, so a
      // previously-flagged mismatch clears as soon as they line up again.
      if (field === "password" && errors.confirmPassword && !validators.confirmPassword(next.confirmPassword, next)) {
        setErrors((prevErrors) => ({ ...prevErrors, confirmPassword: undefined }));
      }
      return next;
    });
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone } = formData;

    const nextErrors = {};
    Object.keys(validators).forEach((field) => {
      const message = validators[field](formData[field], formData);
      if (message) nextErrors[field] = message;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const user = await authService.register({ firstName, lastName, email, password, phone, role: 'user' });
      Alert.alert("Success", "Registration successful! Welcome to CP Shipper.");
      navigation.replace("Home");
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      Alert.alert("Registration Error", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };



  return (

    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={[styles.topSection, { backgroundColor: colors.primary }]}
          >
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <Feather name="truck" size={32} color={colors.primary} />
              </View>
              <AppText variant="screenTitle" style={styles.title}>Create account</AppText>
              <AppText weight="semiBold" style={styles.subtitle}>Join CP Shipper today</AppText>
            </View>

          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <FormInput
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChangeText={(value) => handleChange("firstName", value)}
                error={errors.firstName}
                editable={!loading}
                containerStyle={{ flex: 1 }}
              />
              <FormInput
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChangeText={(value) => handleChange("lastName", value)}
                error={errors.lastName}
                editable={!loading}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <FormInput
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <View style={styles.inputContainer}>
              <AppText variant="label" style={styles.label}>Phone</AppText>

              <View style={styles.phoneRow}>
                <View style={[styles.countryPicker, styles.countryCodeStatic]}>
                  <AppText weight="semiBold" style={styles.countryCodeText}>🇺🇸 +1</AppText>
                </View>

                <FormInput
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => handleChange("phone", value)}
                  error={errors.phone}
                  editable={!loading}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />
              </View>
            </View>

            <FormInput
              label="Password"
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
              error={errors.password}
              editable={!loading}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              }
            />

            <FormInput
              label="Confirm Password"
              placeholder="Confirm password"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange("confirmPassword", value)}
              error={errors.confirmPassword}
              editable={!loading}
              rightElement={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              disabled={loading}
              onPress={handleRegister}
              activeOpacity={0.9}
            >
              <View
                style={[styles.button, { backgroundColor: colors.primary }]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <AppText variant="button" style={styles.buttonText}>
                    Create Account
                  </AppText>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.footer}>
              <AppText weight="semiBold" style={styles.footerText}>Already have an account?</AppText>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <AppText weight="semiBold" style={styles.linkText}>Sign in</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },

  countryPicker: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    width: 120,

    justifyContent: "center",
    fontFamily: fonts.regular,
  },

  countryCodeStatic: {
    height: 50,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },

  countryCodeText: {
    fontSize: 15,
    color: colors.text,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: "center",
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
    alignItems: "center",
  },
  topSection: {
    paddingTop: spacing.huge,
    paddingBottom: 60,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  card: {
    backgroundColor: colors.surface,
    marginTop: -40,
    marginHorizontal: spacing.lg,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.white,
    marginBottom: spacing.xs,

  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    color: colors.text,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.input,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    fontSize: 15,
    color: colors.text,
    fontFamily: fonts.regular,
  },
 button: {
  borderRadius: radius.button,
  paddingVertical: spacing.base,
  alignItems: "center",
  marginTop: spacing.lg,
},
  buttonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    shadowOpacity: 0,
  },
  buttonText: {
    color: colors.white,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 13,
    marginRight: spacing.sm,
  },
  linkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  segment: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.white,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.primary,
  },
});
