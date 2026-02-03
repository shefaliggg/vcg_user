import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import authService from "../services/auth.service";
import getErrorMessage from "../utils/errorHandler";

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, phone } = formData;

    // Client-side validation
    if (!firstName.trim()) {
      Alert.alert("Validation Error", "Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      Alert.alert("Validation Error", "Please enter your last name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation Error", "Please enter your phone number.");
      return;
    }
    if (!password) {
      Alert.alert("Validation Error", "Please enter a password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const user = await authService.register({ firstName, lastName, email, password, phone, role: 'user' });
      Alert.alert("Success", "Registration successful! Welcome to VCG Transport.");
      navigation.replace("Home");
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      Alert.alert("Registration Error", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1E3A8A', '#3B82F6', '#60A5FA']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>🚚</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join VCG Transport today</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#999"
                  value={formData.firstName}
                  onChangeText={(value) => handleChange("firstName", value)}
                  editable={!loading}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#999"
                  value={formData.lastName}
                  onChangeText={(value) => handleChange("lastName", value)}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(value) => handleChange("phone", value)}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => handleChange("password", value)}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <Text style={styles.linkText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: -0.5,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: "#1E3A8A",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#1E3A8A",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    marginRight: 6,
  },
  linkText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  segment: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
  },
  segmentText: {
    color: '#fff',
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#1E3A8A',
  },
});
