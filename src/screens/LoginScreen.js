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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import authService from "../services/auth.service";
import getErrorMessage from "../utils/errorHandler";
import { registerForPushNotifications } from "../services/push.service";
import AppText from "../components/AppText";
import { Pressable } from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const inputBorder = (field) => ({
    borderColor: focusedInput === field ? "#1E40AF" : "#E2E8F0",
    borderWidth: 1,
  });

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email.");
      return;
    }
    if (!password) {
      Alert.alert("Validation Error", "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await authService.login({ email, password });
      await registerForPushNotifications();
      navigation.replace("Home");
    } catch (error) {
      Alert.alert("Login Error", getErrorMessage(error));
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
          overScrollMode="never"
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="truck" size={28} color="#1E3A8A" />
            </View>
            <AppText weight="bold" style={styles.title}>
              Welcome back
            </AppText>
            <AppText style={styles.subtitle}>
              Sign in to continue
            </AppText>
          </View>

          {/* White Card */}
          <View style={styles.card}>

            {/* Email */}
            <View style={styles.inputContainer}>
              <AppText weight="semiBold" style={styles.label}>
                Email
              </AppText>
              <TextInput
                style={[styles.input, inputBorder("email")]}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <AppText weight="semiBold" style={styles.label}>
                Password
              </AppText>

              <View
                style={[
                  styles.passwordBox,
                  inputBorder("password"),
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                />

                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#64748B"
                  />
                </Pressable>

              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={{ alignSelf: "flex-end", marginTop: 8 }}
              >
                <AppText style={styles.forgot}>
                  Forgot Password?
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText weight="bold" style={styles.buttonText}>
                  Sign In
                </AppText>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <AppText style={styles.footerText}>
                New to VCG Transport?
              </AppText>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
              >
                <AppText weight="semiBold" style={styles.link}>
                  Create account
                </AppText>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 100,
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
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
  passwordBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    paddingVertical: 14,
  },
  forgot: {
    fontSize: 13,
    color: "#2563EB",
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#64748B",
    marginRight: 6,
  },
  link: {
    color: "#1E40AF",
  },
});
