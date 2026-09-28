import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import FormInput from "../components/FormInput";
import authService from "../services/auth.service";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [otpError, setOtpError] = useState(null);
  const [errors, setErrors] = useState({});
  const inputs = useRef([]);

  const validators = {
    password: (v) => {
      if (!v) return "Required";
      if (v.length < 6) return "Must be at least 6 characters";
      return null;
    },
    confirmPassword: (v, pass) => {
      if (!v) return "Required";
      if (v !== pass) return "Passwords do not match";
      return null;
    },
  };

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError(null);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (errors.password && !validators.password(value)) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (errors.confirmPassword && !validators.confirmPassword(confirmPassword, value)) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (errors.confirmPassword && !validators.confirmPassword(value, password)) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async () => {
    const fullOtp = otp.join("");

    const nextErrors = {
      password: validators.password(password),
      confirmPassword: validators.confirmPassword(confirmPassword, password),
    };
    const hasFieldErrors = nextErrors.password || nextErrors.confirmPassword;
    const otpIncomplete = fullOtp.length !== 6;

    if (otpIncomplete) {
      setOtpError("Enter the complete 6-digit code");
    } else {
      setOtpError(null);
    }

    if (hasFieldErrors) {
      setErrors(nextErrors);
    } else {
      setErrors({});
    }

    if (otpIncomplete || hasFieldErrors) {
      return;
    }

    try {
      await authService.verifyResetOtp({
        email,
        otp: fullOtp,
        newPassword: password,
      });

      Alert.alert("Success", "Password reset successful");
      navigation.replace("Login");

    } catch (error) {
      Alert.alert("Error", "Invalid or expired OTP");
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
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="shield" size={26} color={colors.primary} />
            </View>

            <AppText variant="screenTitle" style={styles.title}>
              Verify OTP
            </AppText>

            <AppText style={styles.subtitle}>
              Enter the 6 digit code sent to {email}
            </AppText>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* OTP BOXES */}
            <View style={[styles.otpRow, otpError && { marginBottom: spacing.sm }]}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[
                    styles.otpBox,
                    focusedIndex === index && styles.otpFocused,
                    otpError && styles.otpBoxError,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  onChangeText={(value) =>
                    handleOtpChange(value, index)
                  }
                />
              ))}
            </View>
            {otpError && <AppText style={styles.otpErrorText}>{otpError}</AppText>}

            {/* New Password */}
            <FormInput
              placeholder="New password"
              secureTextEntry
              value={password}
              onChangeText={handlePasswordChange}
              error={errors.password}
            />

            <FormInput
              placeholder="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              error={errors.confirmPassword}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
            >
              <AppText variant="button" style={styles.buttonText}>
                Reset Password
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
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xxl,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: colors.background,
  },
  otpFocused: {
    borderColor: colors.primary,
  },
  otpBoxError: {
    borderColor: colors.error,
  },
  otpErrorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
  },
});

