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
import { Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import AppText from "../components/AppText";
import { fonts } from "../themes/typography";
const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    countryCode: "+91",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

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
    if (password !== formData.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
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
      Alert.alert("Registration Error", friendlyMessage,error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputBorder = (field) => ({
    borderColor: focusedInput === field ? "#0F2E73" : "rgba(255,255,255,0.4)",
    borderWidth: 1,
  });



  return (

    <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <LinearGradient
            colors={['#1E3A8A', '#2563EB']}
            style={styles.topSection}
          >
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <Feather name="truck" size={32} color="#1E3A8A" />
              </View>
              <AppText weight="bold" style={styles.title}>Create account</AppText>
              <AppText weight="semiBold" style={styles.subtitle}>Join VCG Transport today</AppText>
            </View>

          </LinearGradient>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <AppText weight="semiBold" style={styles.label}>First Name</AppText>
                <TextInput
                  onFocus={() => setFocusedInput("firstName")}
                  onBlur={() => setFocusedInput(null)}
                  style={[styles.input, inputBorder("firstName")]}
                  placeholder="John"
                  placeholderTextColor="#999"
                  value={formData.firstName}
                  onChangeText={(value) => handleChange("firstName", value)}
                  editable={!loading}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <AppText weight="semiBold" style={styles.label}>Last Name</AppText>
                <TextInput
                  onFocus={() => setFocusedInput("lastName")}
                  onBlur={() => setFocusedInput(null)}
                  style={[styles.input, inputBorder("lastName")]}
                  placeholder="Doe"
                  placeholderTextColor="#999"
                  value={formData.lastName}
                  onChangeText={(value) => handleChange("lastName", value)}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <AppText weight="semiBold" style={styles.label}>Email</AppText>
              <TextInput
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                style={[styles.input, inputBorder("email")]}
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
              <AppText weight="semiBold" style={styles.label}>Phone</AppText>

              <View style={styles.phoneRow}>
                <View style={styles.countryPicker}>
                  <Picker
                    selectedValue={formData.countryCode}
                    onValueChange={(value) => handleChange("countryCode", value)}
                    style={{ height: 50, fontFamily: fonts.regular }}
                    dropdownIconColor="#1E3A8A"
                  >
                    <Picker.Item label="+91 (India)" value="+91" />
                    <Picker.Item label="+1 (USA)" value="+1" />
                    <Picker.Item label="+971 (UAE)" value="+971" />
                  </Picker>
                </View>

                <TextInput
                  onFocus={() => setFocusedInput("phone")}
                  onBlur={() => setFocusedInput(null)}
                  style={[styles.input, { flex: 1 }, inputBorder("phone")]}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => handleChange("phone", value)}

                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <AppText weight="semiBold" style={styles.label}>Password</AppText>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }, inputBorder("password")]}
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(value) => handleChange("password", value)}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                />

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#1E3A8A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <AppText weight="semiBold" style={styles.label}>Confirm Password</AppText>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }, inputBorder("confirmPassword")]}
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleChange("confirmPassword", value)}
                  onFocus={() => setFocusedInput("confirmPassword")}
                  onBlur={() => setFocusedInput(null)}
                />

                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#1E3A8A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              disabled={loading}
              onPress={handleRegister}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#1E3A8A', '#2563EB']}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AppText weight="bold" style={styles.buttonText}>
                    Create Account
                  </AppText>
                )}
              </LinearGradient>
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
    backgroundColor: "#fff",
    borderRadius: 14,
    width: 120,
    
    justifyContent: "center",
    fontFamily: fonts.regular,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
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
    marginTop: 80,
    marginBottom: 40,
    alignItems: "center",
  },
  topSection: {
    paddingTop: 100,
    paddingBottom: 60,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  card: {
    backgroundColor: "#fff",
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 6,

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
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    padding:20,
    fontSize: 15,
    color: "#1E3A8A",
    fontFamily: fonts.regular,
  },
 button: {
  borderRadius: 14,
  paddingVertical: 16,
  alignItems: "center",
  marginTop: 20,
},
  buttonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    color: "rgba(3, 0, 152, 0.8)",
    fontSize: 13,
    marginRight: 6,
  },
  linkText: {
    color: "#900101",
    fontSize: 13,
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
