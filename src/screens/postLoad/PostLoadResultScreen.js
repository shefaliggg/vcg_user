import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";
import { usePostLoad } from "./PostLoadContext";

// Shown after Post Load or Save Draft succeeds.
export default function PostLoadResultScreen({ navigation, route }) {
  const { kind, bookingId, loadNumber } = route.params || {};
  const { reset } = usePostLoad();
  const posted = kind === "posted";

  const done = () => {
    reset();
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: posted ? "#DCFCE7" : colors.primaryLight }]}>
          <Feather name={posted ? "check" : "save"} size={34} color={posted ? colors.success : colors.primary} />
        </View>
        <AppText variant="screenTitle" style={styles.title}>{posted ? "Load submitted for review" : "Draft saved"}</AppText>
        <AppText style={styles.text}>
          {posted
            ? "Your load was submitted for admin review. Drivers will be able to see it and send quotes after it is approved."
            : "Your load is saved as a draft. Drivers can't see it until you post it."}
        </AppText>
        {posted && !!loadNumber && <AppText style={styles.loadNumber}>Load number: {loadNumber}</AppText>}

        {posted && !!bookingId && (
          <TouchableOpacity style={styles.primary} onPress={() => { reset(); navigation.navigate("LoadDetails", { bookingId }); }}>
            <AppText variant="button" style={{ color: colors.white }}>View Load</AppText>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={posted ? styles.secondary : styles.primary} onPress={done}>
          <AppText variant="button" style={{ color: posted ? colors.primary : colors.white }}>Done</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border, ...shadows.card },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  title: { color: colors.text, marginBottom: spacing.sm },
  text: { color: colors.textMuted, textAlign: "center", marginBottom: spacing.xl },
  loadNumber: { color: colors.text, fontWeight: "600", marginBottom: spacing.lg },
  primary: { alignSelf: "stretch", alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: spacing.base, marginBottom: spacing.md },
  secondary: { alignSelf: "stretch", alignItems: "center", borderRadius: radius.button, borderWidth: 1, borderColor: colors.primary, paddingVertical: spacing.base },
});
