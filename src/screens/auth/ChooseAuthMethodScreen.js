import React from "react";
import { View, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

export default function ChooseAuthMethodScreen({ navigation, route }) {
  const intent = route.params?.intent || "signup";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.primary }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={colors.white} />
        </TouchableOpacity>
        <AppText variant="screenTitle" style={styles.title}>
          How would you like to continue?
        </AppText>
      </View>

      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate("PhoneAuth", { intent })}
          >
            <Feather name="smartphone" size={26} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText weight="semiBold">Continue with Phone</AppText>
              <AppText style={{ fontSize: 13, color: colors.textMuted }}>
                Use your mobile number to sign in.
              </AppText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => navigation.navigate("EmailAuth", { intent })}
          >
            <Feather name="mail" size={26} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText weight="semiBold">Continue with Email</AppText>
              <AppText style={{ fontSize: 13, color: colors.textMuted }}>
                Use your email address to sign in.
              </AppText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
  },
  container: {
    padding: spacing.lg,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
});
