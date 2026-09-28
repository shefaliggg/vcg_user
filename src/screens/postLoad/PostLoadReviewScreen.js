import React from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { usePostLoad, useSubmitLoad, validateDetails, validatePickup, validateDelivery } from "./PostLoadContext";
import { StepShell, ReviewSection, cityState, scheduleLine, shared } from "./PostLoadUI";

// Step 6 - nothing to type here; check it over, jump back to fix anything, then post.
export default function PostLoadReviewScreen({ navigation }) {
  const { formData: f } = usePostLoad();
  const { submit, submitting, serverError } = useSubmitLoad(navigation);

  // Same required fields as steps 1-3, in case the shipper skipped around.
  const missing = [
    Object.keys(validateDetails(f)).length && ["Load details are incomplete", "Booking"],
    Object.keys(validatePickup(f)).length && ["Pickup details are incomplete", "PostLoadPickup"],
    Object.keys(validateDelivery(f)).length && ["Delivery details are incomplete", "PostLoadDelivery"],
  ].filter(Boolean);

  const specials = [
    f.hazmat && "Hazmat",
    f.temperatureControlled && "Temperature controlled",
    f.oversized && "Oversized",
    f.liftgateRequired && "Liftgate",
    f.teamDriverRequired && "Team driver",
  ].filter(Boolean);

  return (
    <StepShell
      step={6}
      title="Review & Post"
      subtitle="Check the details before drivers see your load"
      onBack={() => navigation.goBack()}
      error={serverError}
      footer={
        <View>
          {missing.map(([text, route]) => (
            <TouchableOpacity key={route} onPress={() => navigation.navigate(route)}>
              <AppText style={styles.missing}>{text} · tap to fix</AppText>
            </TouchableOpacity>
          ))}
          <AppText style={[shared.hint, styles.note]}>Drivers will send quotes after you post. You choose which quote to accept.</AppText>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.draftButton} onPress={() => submit(true)} disabled={!!submitting}>
              {submitting === "draft" ? <ActivityIndicator color={colors.primary} /> : (
                <AppText weight="semiBold" style={{ color: colors.primary }}>Save Draft</AppText>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.postButton, missing.length > 0 && { opacity: 0.5 }]} onPress={() => submit(false)} disabled={!!submitting || missing.length > 0}>
              {submitting === "post" ? <ActivityIndicator color={colors.white} /> : (
                <AppText variant="button" style={{ color: colors.white }}>Post Load</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      }
    >
      <ReviewSection
        title="Pickup"
        onEdit={() => navigation.navigate("PostLoadPickup")}
        rows={[
          ["Location", cityState(f.pickupLocation.address)],
          ["Date & time", scheduleLine(f.pickupDate, f.pickupTime, f.pickupWindowStart, f.pickupWindowEnd)],
        ]}
      />
      <ReviewSection
        title="Delivery"
        onEdit={() => navigation.navigate("PostLoadDelivery")}
        rows={[
          ["Location", cityState(f.deliveryLocation.address)],
          ["Date & time", scheduleLine(f.deliveryDate, f.deliveryTime, f.deliveryWindowStart, f.deliveryWindowEnd)],
        ]}
      />
      <ReviewSection
        title="Load"
        onEdit={() => navigation.navigate("Booking")}
        rows={[
          ["Commodity", f.commodity || "—"],
          ["Equipment", f.equipmentType || "—"],
          ["Weight", f.weight ? `${Number(f.weight).toLocaleString()} lbs` : "—"],
          ["Special requirements", specials.join(", ") || "None"],
        ]}
      />
      <ReviewSection
        title="Documents"
        onEdit={() => navigation.navigate("PostLoadDocuments")}
        rows={[["Attached", f.documents.length ? `${f.documents.length} attached` : "None (can be added later)"]]}
      />
    </StepShell>
  );
}

const styles = StyleSheet.create({
  missing: { color: colors.error, textAlign: "center", marginBottom: spacing.sm, fontSize: 13 },
  note: { textAlign: "center", marginBottom: spacing.base },
  buttons: { flexDirection: "row", gap: spacing.md },
  draftButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.base, borderRadius: radius.button, borderWidth: 1, borderColor: colors.primary },
  postButton: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.base, borderRadius: radius.button, backgroundColor: colors.primary },
});
