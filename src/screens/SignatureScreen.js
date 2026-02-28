import React, { useRef, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import SignatureCanvas from "react-native-signature-canvas";
import bookingService from "../services/booking.service";
import AppText from "../components/AppText";

export default function SignatureScreen({ route, navigation }) {
  const { bookingId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const signatureRef = useRef();

  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused → refetch booking");
    }, [bookingId])
  );

  const handleSignature = async (base64Signature) => {
    try {
      setLoading(true);

      await bookingService.userSignRateConfirmation(
        bookingId,
        base64Signature
      );

      Alert.alert(
        "Success",
        "Rate confirmation signed successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Error signing:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to sign"
      );
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
    <SafeAreaView style={styles.safeContainer} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <AppText weight="bold" style={styles.headerText}>
          Sign Rate Confirmation
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.subHeader}>
        <Feather name="edit-3" size={16} color="#1E3A8A" />
        <AppText style={styles.subText}>
          Please sign below to accept the rate
        </AppText>
      </View>

      {/* SIGNATURE AREA */}
      <View style={styles.signatureContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={() => Alert.alert("Error", "Please provide a signature")}
          descriptionText=""
          clearText=""
          confirmText=""
          webStyle={`
            .m-signature-pad { box-shadow: none; border: none; }
            .m-signature-pad--body { border: none; }
            .m-signature-pad--footer { display: none; }
          `}
        />
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          disabled={loading}
        >
          <Feather name="trash-2" size={18} color="#fff" />
          <AppText weight="semiBold" style={styles.buttonText}>
            Clear
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <AppText weight="semiBold" style={styles.buttonText}>
                Sign & Submit
              </AppText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  header: {
    backgroundColor: "#1E3A8A",
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerText: {
    fontSize: 18,
    color: "#fff",
  },

  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },

  subText: {
    fontSize: 14,
    color: "#1E293B",
    marginLeft: 6,
  },

  signatureContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#1E3A8A",
  },

  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F1F5F9",
    gap: 12,
  },

  clearButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 14,
  },

  confirmButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E3A8A",
    paddingVertical: 14,
    borderRadius: 14,
  },

  buttonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
  },
});