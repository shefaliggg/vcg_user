import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import uploadService from "../../services/upload.service";
import AppText from "../../components/AppText";
import FormInput from "../../components/FormInput";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { usePostLoad, useSubmitLoad } from "./PostLoadContext";
import { StepShell, StepFooter, SectionCard, DocCard, shared } from "./PostLoadUI";

// Step 5 - documents can be attached now or after posting; notes are optional too.
export default function PostLoadDocumentsScreen({ navigation }) {
  const { formData, setField } = usePostLoad();
  const { submit, submitting, serverError } = useSubmitLoad(navigation);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const bol = formData.documents.find((d) => d.docType === "bol");
  const otherDocs = formData.documents.filter((d) => d.docType === "other");

  const attach = async (docType, asset) => {
    setUploadingDoc(docType);
    setUploadError(null);
    try {
      const res = await uploadService.uploadBookingDocument(asset.uri, asset.name, asset.mimeType);
      const doc = { docType, fileUrl: res.fileUrl, fileName: res.fileName || asset.name };
      // BOL is a single slot (replace); everything else stacks up.
      setField("documents", docType === "other" ? [...formData.documents, doc] : [...formData.documents.filter((d) => d.docType !== docType), doc]);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Could not upload the document. Try again.");
    } finally {
      setUploadingDoc(null);
    }
  };

  const pickFile = async (docType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const a = result.assets[0];
      await attach(docType, { uri: a.uri, name: a.name, mimeType: a.mimeType });
    } catch (err) {
      setUploadError("Could not open the file picker.");
    }
  };

  const takePhoto = async (docType) => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setUploadError("Allow camera access to take a photo of the document.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      await attach(docType, { uri: result.assets[0].uri, name: `photo-${Date.now()}.jpg`, mimeType: "image/jpeg" });
    } catch (err) {
      setUploadError("Could not open the camera.");
    }
  };

  return (
    <StepShell
      step={5}
      title="Documents & Notes"
      subtitle="Optional. You can also add documents after posting"
      onBack={() => navigation.goBack()}
      error={serverError}
      footer={<StepFooter onContinue={() => navigation.navigate("PostLoadReview")} onSaveDraft={() => submit(true)} savingDraft={submitting === "draft"} />}
    >
      <SectionCard title="Upload Documents">
        <DocCard label="Bill of Lading (BOL)" doc={bol} uploading={uploadingDoc === "bol"} onUpload={() => pickFile("bol")} onPhoto={() => takePhoto("bol")} />

        <AppText variant="label" style={shared.label}>Other Supporting Documents</AppText>
        <AppText style={shared.hint}>Load instructions, commodity documentation, etc.</AppText>
        {otherDocs.map((doc, i) => (
          <View key={`${doc.fileUrl}-${i}`} style={styles.otherDocRow}>
            <Feather name="file-text" size={16} color={colors.primary} />
            <AppText style={styles.otherDocName} numberOfLines={1}>{doc.fileName}</AppText>
            <Feather name="check-circle" size={16} color={colors.success} />
          </View>
        ))}
        <View style={styles.docButtonsRow}>
          <TouchableOpacity style={styles.docButton} onPress={() => pickFile("other")} disabled={uploadingDoc === "other"}>
            {uploadingDoc === "other" ? <ActivityIndicator color={colors.primary} /> : (
              <>
                <Feather name="upload" size={16} color={colors.primary} />
                <AppText weight="semiBold" style={styles.docButtonText}>Upload from Device</AppText>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.docButton} onPress={() => takePhoto("other")} disabled={uploadingDoc === "other"}>
            <Feather name="camera" size={16} color={colors.primary} />
            <AppText weight="semiBold" style={styles.docButtonText}>Take Photo</AppText>
          </TouchableOpacity>
        </View>
        {!!uploadError && <AppText style={shared.errorText}>{uploadError}</AppText>}
      </SectionCard>

      <SectionCard title="Additional Instructions / Notes">
        <FormInput label="Additional Instructions" placeholder="Visible to drivers" value={formData.specialInstructions} onChangeText={(v) => setField("specialInstructions", v)} multiline numberOfLines={3} inputStyle={shared.textArea} />
        <FormInput label="Reference / PO Number" placeholder="e.g., PO-48213" value={formData.referenceNumber} onChangeText={(v) => setField("referenceNumber", v)} />
        <FormInput label="Internal Notes" placeholder="For your team only" value={formData.internalNotes} onChangeText={(v) => setField("internalNotes", v)} multiline numberOfLines={3} inputStyle={shared.textArea} containerStyle={{ marginBottom: 0 }} />
      </SectionCard>
    </StepShell>
  );
}

const styles = StyleSheet.create({
  otherDocRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  otherDocName: { flex: 1, fontSize: 13, color: colors.text },
  docButtonsRow: { flexDirection: "row", gap: spacing.sm },
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
});
