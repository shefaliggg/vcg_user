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
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import authService from "../services/auth.service";

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputs = useRef([]);

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleSubmit = async () => {
    const fullOtp = otp.join("");

    if (fullOtp.length !== 6) {
      Alert.alert("Error", "Enter complete OTP");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
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
    <LinearGradient
      colors={["#1E3A8A", "#2563EB"]}
      style={{ flex: 1 }}
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
              <Feather name="shield" size={26} color="#1E3A8A" />
            </View>

            <AppText weight="bold" style={styles.title}>
              Verify OTP
            </AppText>

            <AppText style={styles.subtitle}>
              Enter the 6 digit code sent to {email}
            </AppText>
          </View>

          {/* Card */}
          <View style={styles.card}>

            {/* OTP BOXES */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[
                    styles.otpBox,
                    focusedIndex === index && styles.otpFocused,
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

            {/* New Password */}
            <TextInput
              style={styles.input}
              placeholder="New password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
            >
              <AppText weight="bold" style={styles.buttonText}>
                Reset Password
              </AppText>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 120,
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    flex: 1,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlign: "center",
    fontSize: 20,
    backgroundColor: "#F8FAFC",
  },
  otpFocused: {
    borderColor: "#1E40AF",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#1E40AF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
  },
});