import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AppText from "../components/AppText";
import { colors } from "../themes/colors";
import { spacing } from "../themes/spacing";

// Messaging (driver/admin communication) has no backend yet - this is an honest
// placeholder for the nav slot rather than a fake inbox. Wire this up to a real
// Message model + endpoints when that's ready.
export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.emptyContainer}>
        <Feather name="message-circle" size={48} color={colors.textMuted} />
        <AppText weight="bold" style={styles.emptyTitle}>No messages yet</AppText>
        <AppText style={styles.emptyText}>
          Driver and admin messaging is coming soon.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    color: colors.text,
    marginTop: spacing.base,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
