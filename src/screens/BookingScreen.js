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

          <Text style={styles.label}>Shipper Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter shipper name"
            placeholderTextColor="#999"
            value={formData.shipper.name}
            onChangeText={(value) => handleChange("shipper.name", value)}
            editable={!loading}
          />

          <Text style={styles.label}>Shipper Phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter shipper phone number"
            placeholderTextColor="#999"
            value={formData.shipper.phone}
            onChangeText={(value) => handleChange("shipper.phone", value)}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Consignee Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter consignee name"
            placeholderTextColor="#999"
            value={formData.consignee.name}
            onChangeText={(value) => handleChange("consignee.name", value)}
            editable={!loading}
          />

          <Text style={styles.label}>Consignee Phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter consignee phone number"
            placeholderTextColor="#999"
            value={formData.consignee.phone}
            onChangeText={(value) => handleChange("consignee.phone", value)}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Pickup Location *</Text>
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

          <Text style={styles.label}>Delivery Location *</Text>
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

          <Text style={styles.label}>Pickup Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={formData.pickupDate}
            onChangeText={(value) => handleChange("pickupDate", value)}
            editable={!loading}
          />

          <Text style={styles.label}>Delivery Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={formData.deliveryDate}
            onChangeText={(value) => handleChange("deliveryDate", value)}
            editable={!loading}
          />

          <Text style={styles.label}>Truck Type *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10-wheeler, flatbed"
            placeholderTextColor="#999"
            value={formData.truckType}
            onChangeText={(value) => handleChange("truckType", value)}
            editable={!loading}
          />

          <Text style={styles.label}>Cargo Type *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Electronics, Furniture, Food"
            placeholderTextColor="#999"
            value={formData.cargoType}
            onChangeText={(value) => handleChange("cargoType", value)}
            editable={!loading}
          />

          <Text style={styles.label}>Cargo Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weight in kg"
            placeholderTextColor="#999"
            value={formData.cargoWeight}
            onChangeText={(value) => handleChange("cargoWeight", value)}
            keyboardType="numeric"
            editable={!loading}
          />

          <Text style={styles.label}>Special Instructions (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
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
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 8,
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
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#7b2ff2",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
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
  autocompleteContainer: {
    flex: 0,
    zIndex: 10,
  },
  autocompleteList: {
    backgroundColor: "#fff",
  },
});
