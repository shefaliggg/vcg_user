import React, { useEffect, useState, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import shipperProfileService from "../../services/shipperProfile.service";
import getErrorMessage from "../../utils/errorHandler";
import AppText from "../../components/AppText";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { radius } from "../../themes/radius";
import { shadows } from "../../themes/shadows";

const DOC_TYPES = [
  { field: "businessLicense", docType: "business_license", label: "Business License", required: true },
  { field: "insuranceCoi", docType: "insurance_coi", label: "Certificate of Insurance", required: true },
  { field: "w9", docType: "w9", label: "W-9 Form", required: true },
  { field: "other", docType: "other", label: "Other Supporting Document", required: false },
];

const DocRow = ({ meta, asset, onExisting, onPick, onPhoto, uploading }) => (
  <View style={styles.docRow}>
    <View style={styles.docHeader}>
      <Feather
        name={asset || onExisting ? "check-circle" : "file-text"}
        size={18}
        color={asset || onExisting ? colors.success : colors.textMuted}
      />
      <AppText weight="semiBold" style={styles.docLabel}>
        {meta.label}{meta.required ? " *" : " (optional)"}
      </AppText>
    </View>
    <AppText style={styles.docFileName} numberOfLines={1}>
      {asset?.name || (onExisting ? "Uploaded — tap to replace" : "Not uploaded yet")}
    </AppText>
    <View style={styles.docButtonsRow}>
      <TouchableOpacity style={styles.docButton} onPress={onPick} disabled={uploading}>
        {uploading ? <ActivityIndicator color={colors.primary} /> : (
          <>
            <Feather name="upload" size={14} color={colors.primary} />
            <AppText weight="semiBold" style={styles.docButtonText}>Upload File</AppText>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.docButton} onPress={onPhoto} disabled={uploading}>
        <Feather name="camera" size={14} color={colors.primary} />
        <AppText weight="semiBold" style={styles.docButtonText}>Take Photo</AppText>
      </TouchableOpacity>
    </View>
  </View>
);

export default function RequiredDocumentsScreen({ navigation }) {
  const [assets, setAssets] = useState({});
  const [existingTypes, setExistingTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useFocusEffect(
    useCallback(() => {
      shipperProfileService
        .getDocuments()
        .then((docs) => setExistingTypes((docs || []).map((d) => d.docType)))
        .catch(() => {});
    }, [])
  );

  const pickFile = async (field) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const a = result.assets[0];
      // On web, expo-document-picker hands back a blob: URI plus a real browser File
      // object (a.file) - the upload service needs that File, since RN Web's FormData
      // can't turn a {uri,name,type} object back into file bytes the way native RN can.
      setAssets((prev) => ({ ...prev, [field]: { uri: a.uri, name: a.name, mimeType: a.mimeType, file: a.file } }));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Could not open the file picker.");
    }
  };

  const takePhoto = async (field) => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setErrorMessage("Allow camera access to take a photo of the document.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      setAssets((prev) => ({
        ...prev,
        [field]: {
          uri: result.assets[0].uri,
          name: `${field}-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          file: result.assets[0].file,
        },
      }));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage("Could not open the camera.");
    }
  };

  const handleContinue = async () => {
    const missing = DOC_TYPES.filter((d) => d.required && !assets[d.field] && !existingTypes.includes(d.docType));
    if (missing.length) {
      setErrorMessage(`Please upload: ${missing.map((d) => d.label).join(", ")}`);
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      await shipperProfileService.uploadDocuments(assets);
      navigation.navigate("TermsAgreements");
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
          <AppText style={styles.progressText}>Step 6 of 8</AppText>
          <AppText variant="screenTitle" style={styles.title}>Required Documents</AppText>
          <AppText style={styles.subtitle}>Admin verifies these before your account can post loads.</AppText>
        </View>

        <View style={styles.card}>
          {DOC_TYPES.map((meta) => (
            <DocRow
              key={meta.field}
              meta={meta}
              asset={assets[meta.field]}
              onExisting={existingTypes.includes(meta.docType)}
              uploading={false}
              onPick={() => pickFile(meta.field)}
              onPhoto={() => takePhoto(meta.field)}
            />
          ))}

          {!!errorMessage && <AppText style={styles.errorText}>{errorMessage}</AppText>}

          <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
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
  scrollContainer: { flexGrow: 1, paddingBottom: 40 },
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
  title: { color: colors.white, marginBottom: spacing.xs },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
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
  docRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  docHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  docLabel: { fontSize: 14, color: colors.text },
  docFileName: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginLeft: 26 },
  docButtonsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  docButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  docButtonText: { fontSize: 12, color: colors.primary },
  errorText: { color: colors.error, marginBottom: spacing.sm, textAlign: "center" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  buttonText: { color: colors.white },
});
