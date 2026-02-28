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
  FlatList,
} from "react-native";
import bookingService from "../services/booking.service";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { GOOGLE_MAPS_API_KEY } from "../utils/googleMaps";
import AppText from "../components/AppText";
import { fonts } from "../themes/typography";

export default function BookingScreen({ navigation }) {
  const [formData, setFormData] = useState({
    shipper: { name: "", phone: "" },
    consignee: { name: "", phone: "" },
    pickupLocation: { address: "", lat: null, lng: null },
    deliveryLocation: { address: "", lat: null, lng: null },
    pickupDate: "",
    deliveryDate: "",
    truckType: "",
    cargoType: "",
    cargoWeight: "",
    specialInstructions: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePlaceSelect = (field, data, details) => {
    if (!details) return;
    const address = details.formatted_address || data.description;
    const lat = details.geometry.location.lat;
    const lng = details.geometry.location.lng;
    setFormData((prev) => ({
      ...prev,
      [field]: { address, lat, lng }
    }));
  };

  const handleSubmit = async () => {
    const {
      shipper,
      consignee,
      pickupLocation,
      deliveryLocation,
      pickupDate,
      deliveryDate,
      truckType,
      cargoType,
      cargoWeight,
      specialInstructions
    } = formData;

    // Validation
    if (!shipper.name || !shipper.name.trim()) {
      Alert.alert("Error", "Please enter shipper name");
      return;
    }
    if (!shipper.phone || !shipper.phone.trim()) {
      Alert.alert("Error", "Please enter shipper phone");
      return;
    }
    if (!consignee.name || !consignee.name.trim()) {
      Alert.alert("Error", "Please enter consignee name");
      return;
    }
    if (!consignee.phone || !consignee.phone.trim()) {
      Alert.alert("Error", "Please enter consignee phone");
      return;
    }
    if (!pickupLocation.address || !pickupLocation.address.trim()) {
      Alert.alert("Error", "Please enter pickup location address");
      return;
    }
    if (!deliveryLocation.address || !deliveryLocation.address.trim()) {
      Alert.alert("Error", "Please enter delivery location address");
      return;
    }
    if (!pickupDate) {
      Alert.alert("Error", "Please enter pickup date");
      return;
    }
    if (!deliveryDate) {
      Alert.alert("Error", "Please enter delivery date");
      return;
    }
    if (!truckType || !truckType.trim()) {
      Alert.alert("Error", "Please enter truck type");
      return;
    }
    if (!cargoType || !cargoType.trim()) {
      Alert.alert("Error", "Please enter cargo type");
      return;
    }
    if (!cargoWeight || isNaN(Number(cargoWeight)) || Number(cargoWeight) <= 0) {
      Alert.alert("Error", "Please enter valid cargo weight (must be a number greater than 0)");
      return;
    }

    // Transform form data to backend schema
    const payload = {
      shipper: {
        name: shipper.name,
        phone: shipper.phone
      },
      consignee: {
        name: consignee.name,
        phone: consignee.phone
      },
      pickupLocation: {
        address: pickupLocation.address,
        lat: pickupLocation.lat ?? 0,
        lng: pickupLocation.lng ?? 0
      },
      deliveryLocation: {
        address: deliveryLocation.address,
        lat: deliveryLocation.lat ?? 0,
        lng: deliveryLocation.lng ?? 0
      },
      pickupDate,
      deliveryDate,
      truckType,
      loadDetails: {
        weight: Number(cargoWeight),
        type: cargoType,
        description: specialInstructions || ""
      }
    };

    setLoading(true);
    try {
      console.log('Booking payload:', payload);
      const result = await bookingService.createBooking(payload);
      console.log('Booking created response:', result);
      Alert.alert("Success", "Booking created successfully!", [
        {
          text: "View Quotes",
          onPress: () => {
            console.log('Navigating to BookingQuotes with ID:', result.bookingId);
            navigation.navigate("BookingQuotes", { bookingId: result.bookingId });
          },
        },
        {
          text: "Done",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.log('Booking error:', error?.response?.data || error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create booking"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={[{ key: 'form' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        renderItem={() => (
          <View style={styles.innerContainer}>

            <AppText weight="semiBold" style={styles.label}>Shipper Name *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter shipper name"
              placeholderTextColor="#999"
              value={formData.shipper.name}
              onChangeText={(value) => handleChange("shipper.name", value)}
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Shipper Phone *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter shipper phone number"
              placeholderTextColor="#999"
              value={formData.shipper.phone}
              onChangeText={(value) => handleChange("shipper.phone", value)}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Consignee Name *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter consignee name"
              placeholderTextColor="#999"
              value={formData.consignee.name}
              onChangeText={(value) => handleChange("consignee.name", value)}
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Consignee Phone *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter consignee phone number"
              placeholderTextColor="#999"
              value={formData.consignee.phone}
              onChangeText={(value) => handleChange("consignee.phone", value)}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Pickup Location *</AppText>
            <GooglePlacesAutocomplete
              placeholder="Search pickup location"
              fetchDetails
              onPress={(data, details = null) => handlePlaceSelect("pickupLocation", data, details)}
              query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
              enablePoweredByContainer={false}
              styles={{
                textInput: styles.input,
                container: styles.autocompleteContainer,
                listView: styles.autocompleteList
              }}
              debounce={200}
            />

            <AppText weight="semiBold" style={styles.label}>Delivery Location *</AppText>
            <GooglePlacesAutocomplete
              placeholder="Search delivery location"
              fetchDetails
              onPress={(data, details = null) => handlePlaceSelect("deliveryLocation", data, details)}
              query={{ key: GOOGLE_MAPS_API_KEY, language: "en" }}
              enablePoweredByContainer={false}
              styles={{
                textInput: styles.input,
                container: styles.autocompleteContainer,
                listView: styles.autocompleteList
              }}
              debounce={200}
            />

            <AppText weight="semiBold" style={styles.label}>Pickup Date *</AppText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={formData.pickupDate}
              onChangeText={(value) => handleChange("pickupDate", value)}
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Delivery Date *</AppText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={formData.deliveryDate}
              onChangeText={(value) => handleChange("deliveryDate", value)}
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Truck Type *</AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10-wheeler, flatbed"
              placeholderTextColor="#999"
              value={formData.truckType}
              onChangeText={(value) => handleChange("truckType", value)}
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Cargo Type *</AppText>
            <TextInput
              style={styles.input}
              placeholder="e.g., Electronics, Furniture, Food"
              placeholderTextColor="#999"
              value={formData.cargoType}
              onChangeText={(value) => handleChange("cargoType", value)}
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Cargo Weight (kg) *</AppText>
            <TextInput
              style={styles.input}
              placeholder="Enter weight in kg"
              placeholderTextColor="#999"
              value={formData.cargoWeight}
              onChangeText={(value) => handleChange("cargoWeight", value)}
              keyboardType="numeric"
              editable={!loading}
            />

            <AppText weight="semiBold" style={styles.label}>Special Instructions (Optional)</AppText>
            <TextInput
              style={[styles.input, styles.textArea,]}
              placeholder="Any special handling requirements?"
              placeholderTextColor="#999"
              value={formData.specialInstructions}
              onChangeText={(value) => handleChange("specialInstructions", value)}
              multiline
              numberOfLines={4}
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
                <Text style={styles.buttonText}>Create Booking</Text>
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
    backgroundColor: "#f6f7fb",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 160, // ✅ ADDED THIS ONLY
  },
  innerContainer: {
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 14,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#7b2ff2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "500",
  },
  autocompleteContainer: {
    flex: 0,
    zIndex: 10,
  },
  autocompleteList: {
    backgroundColor: "#fff",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111827",
  },
});