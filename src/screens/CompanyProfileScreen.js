import React, { useState, useEffect } from "react";
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
  FlatList,
} from "react-native";
import userService from "../services/user.service";

export default function CompanyProfileScreen({ navigation }) {
  const [formData, setFormData] = useState({
    companyName: "",
    billingAddress: "",
    email: "",
    phone: "",
    taxId: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      setFetchingProfile(true);
      const response = await userService.getCompanyProfile();
      if (response.data && response.data.data) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.log("Error loading company profile:", error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { companyName, billingAddress, email, phone, taxId } = formData;

    if (!companyName || !companyName.trim()) {
      Alert.alert("Error", "Please enter company name");
      return;
    }
    if (!billingAddress || !billingAddress.trim()) {
      Alert.alert("Error", "Please enter billing address");
      return;
    }
    if (!email || !email.trim()) {
      Alert.alert("Error", "Please enter email");
      return;
    }
    if (!phone || !phone.trim()) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }

    setLoading(true);
    try {
      await userService.updateCompanyProfile({
        companyName,
        billingAddress,
        email,
        phone,
        taxId,
      });
      Alert.alert("Success", "Company profile updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.log("Error updating profile:", error);
      Alert.alert("Error", error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7b2ff2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={[{ key: "form" }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        renderItem={() => (
          <View style={styles.innerContainer}>
            <Text style={styles.title}>Company Profile</Text>
            <Text style={styles.helperText}>
              Update your company details for invoicing and bookings
            </Text>

            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              placeholderTextColor="#999"
              value={formData.companyName}
              onChangeText={(value) => handleChange("companyName", value)}
              editable={!loading}
            />

            <Text style={styles.label}>Billing Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter billing address"
              placeholderTextColor="#999"
              value={formData.billingAddress}
              onChangeText={(value) => handleChange("billingAddress", value)}
              multiline
              numberOfLines={3}
              editable={!loading}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              keyboardType="email-address"
              editable={!loading}
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(value) => handleChange("phone", value)}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Tax ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., GST Number, PAN"
              placeholderTextColor="#999"
              value={formData.taxId}
              onChangeText={(value) => handleChange("taxId", value)}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Company Profile</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        nestedScrollEnabled
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#7b2ff2",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 25,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
