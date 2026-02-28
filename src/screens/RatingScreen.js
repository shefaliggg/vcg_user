import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import ratingService from "../services/rating.service";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "../components/AppText";
import { Feather } from "@expo/vector-icons";

export default function RatingScreen({ route, navigation }) {
  const { tripId, driverId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRatingPress = (value) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    setLoading(true);
    try {
      await ratingService.createRating({
        trip: tripId,
        driver: driverId,
        rating,
        comment,
      });
      Alert.alert("Success", "Thank you for your rating!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit rating"
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <LinearGradient
      colors={["#1E3A8A", "#2563EB"]}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={loading}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <AppText weight="bold" style={styles.headerTitle}>
          Sign Confirmation
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      {/* White Card */}
      <View style={styles.card}>

        <AppText weight="bold" style={styles.title}>
          Rate Confirmation
        </AppText>

        <AppText style={styles.subtitle}>
          Please sign below to accept the rate agreement
        </AppText>

        {/* Signature Area */}
        <View style={styles.signatureContainer}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={() => Alert.alert("Error", "Please provide a signature")}
            descriptionText=""
            clearText="Clear"
            confirmText="Confirm"
            webStyle={`
            .m-signature-pad { box-shadow: none; border: none; }
            .m-signature-pad--body { border: none; }
            .m-signature-pad--footer { display: none; }
          `}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            disabled={loading}
          >
            <AppText weight="semiBold" style={styles.clearText}>
              Clear
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.disabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText weight="bold" style={styles.confirmText}>
                Sign & Submit
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <AppText style={styles.cancelText}>Cancel</AppText>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 60,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
  },

  card: {
    flex: 1,
    marginTop: 40,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },

  title: {
    fontSize: 18,
    color: "#1E293B",
    marginBottom: 6,
  },
  subtitle: {
    color: "#64748B",
    marginBottom: 20,
  },

  signatureContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EF4444",
    alignItems: "center",
  },
  clearText: {
    color: "#EF4444",
  },

  confirmButton: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
  },

  cancelButton: {
    marginTop: 16,
    alignItems: "center",
  },
  cancelText: {
    color: "#64748B",
  },

  disabled: {
    opacity: 0.6,
  },
});