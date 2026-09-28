import React from "react";
import { View, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import authService from "../services/auth.service";
import { showAlert } from "../utils/alert";
import AppText from "./AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";

const COMING_SOON = (label) => showAlert(label, "Coming soon.");

function Item({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Feather name={icon} size={19} color={colors.text} />
      <AppText style={styles.itemLabel}>{label}</AppText>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <AppText weight="bold" style={styles.sectionTitle}>{title}</AppText>
      {children}
    </View>
  );
}

// Slide-in side menu for the shipper app (mirrors the CP Driver drawer).
// Shippers have no availability state, so there is no Online/Offline control.
export default function ShipperDrawer({ visible, onClose, user }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const go = (fn) => () => {
    onClose();
    fn();
  };

  const confirmLogout = () =>
    showAlert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          (navigation.getParent() || navigation).dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
        },
      },
    ]);

  const displayName =
    user?.companyProfile?.companyName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "CP Shipper";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.panelHeader}>
            <View style={{ flex: 1 }}>
              <AppText weight="bold" style={styles.name} numberOfLines={1}>{displayName}</AppText>
              <AppText style={styles.role}>Shipper</AppText>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close menu">
              <Feather name="x" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Section title="MAIN">
              <Item icon="home" label="Dashboard" onPress={go(() => navigation.navigate("Home"))} />
              <Item icon="package" label="My Loads" onPress={go(() => navigation.navigate("Loads"))} />
              <Item icon="map-pin" label="Track Shipments" onPress={go(() => navigation.navigate("TrackingTab"))} />
              <Item icon="clock" label="Load History" onPress={go(() => COMING_SOON("Load History"))} />
            </Section>

            <Section title="ACCOUNT">
              <Item icon="user" label="Company Profile" onPress={go(() => navigation.navigate("Profile"))} />
              <Item icon="file-text" label="Documents" onPress={go(() => COMING_SOON("Documents"))} />
              <Item icon="credit-card" label="Billing & Payments" onPress={go(() => navigation.navigate("Invoices"))} />
              <Item icon="settings" label="Settings" onPress={go(() => COMING_SOON("Settings"))} />
            </Section>

            <Section title="SUPPORT">
              <Item icon="help-circle" label="Help & Support" onPress={go(() => COMING_SOON("Help & Support"))} />
            </Section>
          </ScrollView>

          <TouchableOpacity style={styles.logout} onPress={go(confirmLogout)}>
            <Feather name="log-out" size={19} color={colors.error} />
            <AppText weight="semiBold" style={styles.logoutText}>Logout</AppText>
          </TouchableOpacity>
        </View>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row", backgroundColor: "rgba(15,23,42,0.45)" },
  backdrop: { flex: 1 },
  panel: {
    width: "78%",
    maxWidth: 320,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { fontSize: 17, color: colors.text },
  role: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  section: { marginTop: spacing.base },
  sectionTitle: { fontSize: 11, letterSpacing: 0.6, color: colors.textMuted, marginBottom: spacing.xs },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md },
  itemLabel: { fontSize: 15, color: colors.text, flex: 1 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: { color: colors.error, fontSize: 15 },
});
