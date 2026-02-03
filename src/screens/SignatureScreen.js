import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import SignatureCanvas from "react-native-signature-canvas";
import bookingService from "../services/booking.service";

export default function SignatureScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const signatureRef = useRef();

  const handleSignature = async (signature) => {
    try {
      setLoading(true);
      
      // Sign rate confirmation with signature data
      await bookingService.userSignRateConfirmation(bookingId, signature);
      
      Alert.alert(
        "Success", 
        "Rate confirmation signed successfully! Waiting for driver acceptance.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error signing:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to sign rate confirmation");
      setLoading(false);
    }
  };

  const handleClear = () => {
    signatureRef.current.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current.readSignature();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Sign Rate Confirmation</Text>
        <Text style={styles.subText}>Please sign below to accept the rate</Text>
      </View>

      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={() => Alert.alert("Error", "Please provide a signature")}
          descriptionText=""
          clearText="Clear"
          confirmText="Confirm"
          webStyle={`.m-signature-pad { box-shadow: none; border: none; } 
                     .m-signature-pad--body { border: none; }
                     .m-signature-pad--footer { display: none; }`}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={handleClear}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]} 
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>✓ Sign & Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subText: {
    fontSize: 14,
    color: "#666",
  },
  signatureContainer: {
    flex: 1,
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#7b2ff2",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4caf50",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    margin: 15,
    marginTop: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});
