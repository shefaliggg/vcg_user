import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import shipperProfileService from "../../services/shipperProfile.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

const OPTIONS = [
  { value: "business", icon: "briefcase", label: "Business", description: "Shipping on behalf of a company" },
  { value: "individual", icon: "user", label: "Individual", description: "Shipping for personal use" },
];

export default function AccountTypeScreen({ navigation }) {
  const [accountType, setAccountType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleContinue = async () => {
    if (!accountType) return;
    setErrorMessage(null);
    setLoading(true);
    try {
      await shipperProfileService.saveAccountType(accountType);
      navigation.navigate(accountType === "business" ? "BusinessInformation" : "PrimaryLocation");
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.progress}>
          <AppText style={styles.progressText}>Step 2 of 8</AppText>
          <AppText variant="screenTitle" style={styles.title}>What type of shipper are you?</AppText>
          <AppText style={styles.subtitle}>This determines whether business information is required.</AppText>
        </View>

        <View style={styles.card}>
          {OPTIONS.map((option) => {
            const selected = accountType === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setAccountType(option.value)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconWrapper, selected && styles.iconWrapperSelected]}>
                  <Feather name={option.icon} size={22} color={selected ? colors.white : colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <AppText weight="semiBold">{option.label}</AppText>
                  <AppText style={{ fontSize: 13, color: colors.textMuted }}>{option.description}</AppText>
                </View>
                {selected && <Feather name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}

          {errorMessage && <AppText style={styles.errorText}>{errorMessage}</AppText>}

          <TouchableOpacity
            style={[styles.button, !accountType && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading || !accountType}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText variant="button" style={styles.buttonText}>Continue</AppText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  progress: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  progressText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    marginTop: -20,
    marginHorizontal: spacing.lg,
    borderRadius: radius.card,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.card,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperSelected: {
    backgroundColor: colors.primary,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
  },
});
