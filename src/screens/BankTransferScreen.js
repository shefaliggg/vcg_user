import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import AppText from "../components/AppText";
import invoiceService from "../services/invoice.service";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";
import { radius } from "../themes/radius";

export default function BankTransferScreen({ route, navigation }) {
  const { invoiceId, bankDetails } = route.params || {};
  const [loading, setLoading] = useState(false);

  const copy = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Account number copied to clipboard");
  };

  const handleConfirmTransfer = async () => {
  try {
    setLoading(true);

    await invoiceService.payInvoice(invoiceId, {
      paymentMethod: "offline_confirm",
    });

    Alert.alert("Submitted", "Transfer submitted for verification", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);

  } catch (err) {
    Alert.alert("Error", "Failed to submit transfer");
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>

        <AppText variant="sectionTitle" style={styles.headerTitle}>
          Bank Transfer
        </AppText>

        <View style={{ width: 40 }} />
      </View>

      {/* CONTENT CARD */}
      <View style={styles.card}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <AppText variant="sectionTitle" style={styles.sectionTitle}>
            Transfer Details
          </AppText>

          <View style={styles.row}>
            <AppText style={styles.label}>Account Name</AppText>
            <AppText weight="semiBold">
              {bankDetails?.accountName}
            </AppText>
          </View>

          <View style={styles.row}>
            <AppText style={styles.label}>Bank</AppText>
            <AppText weight="semiBold">
              {bankDetails?.bankName}
            </AppText>
          </View>

          <View style={styles.row}>
            <AppText style={styles.label}>Account Number</AppText>
            <AppText weight="semiBold">
              {bankDetails?.accountNumber}
            </AppText>
          </View>

          <View style={styles.row}>
            <AppText style={styles.label}>IFSC</AppText>
            <AppText weight="semiBold">
              {bankDetails?.ifsc}
            </AppText>
          </View>

          <View style={styles.row}>
            <AppText style={styles.label}>Branch</AppText>
            <AppText weight="semiBold">
              {bankDetails?.branch}
            </AppText>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <AppText style={styles.label}>Amount</AppText>
            <AppText variant="largePrice" style={styles.amount}>
              ${bankDetails?.amount}
            </AppText>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <AppText style={styles.label}>Reference</AppText>
            <AppText weight="semiBold">
              {bankDetails?.referenceNote}
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copy(bankDetails?.accountNumber)}
          >
            <Feather name="copy" size={16} color="#fff" />
            <AppText weight="semiBold" style={styles.copyText}>
              Copy Account Number
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              loading && { opacity: 0.6 },
            ]}
            onPress={handleConfirmTransfer}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="check-circle" size={18} color="#fff" />
                <AppText weight="semiBold" style={styles.confirmText}>
                  I've Transferred
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <AppText style={styles.notice}>
            After transferring, admin will verify and confirm your payment.
          </AppText>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  },

  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.bottomSheet,
    borderTopRightRadius: radius.bottomSheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  sectionTitle: {
    marginBottom: 20,
    color: colors.text,
  },

  row: {
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },

  amount: {
    color: colors.primary,
  },

  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.button,
    marginTop: 20,
    gap: 8,
  },

  copyText: {
    color: "#fff",
  },

  confirmButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.success,
    height: 50,
    borderRadius: radius.button,
    marginTop: 16,
    gap: 8,
  },

  confirmText: {
    color: "#fff",
  },

  notice: {
    marginTop: 18,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
});