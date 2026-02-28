import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import authService from "../services/auth.service";
import AppText from "../components/AppText";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const inputBorder = (field) => ({
    borderColor: focusedInput === field ? "#1E40AF" : "#E2E8F0",
    borderWidth: 1,
  });

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="lock" size={26} color="#1E3A8A" />
            </View>

            <AppText weight="bold" style={styles.title}>
              Forgot Password
            </AppText>

            <AppText style={styles.subtitle}>
              Enter your email to receive a reset OTP
            </AppText>
          </View>

          {/* Card */}
          <View style={styles.card}>

            <View style={styles.inputContainer}>
              <AppText weight="semiBold" style={styles.label}>
                Email
              </AppText>

              <TextInput
                style={[styles.input, inputBorder("email")]}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText weight="bold" style={styles.buttonText}>
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
    marginTop: 6,
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: "#1E293B",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1E293B",
  },
  button: {
    backgroundColor: "#1E40AF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  backLink: {
    textAlign: "center",
    color: "#2563EB",
  },
});