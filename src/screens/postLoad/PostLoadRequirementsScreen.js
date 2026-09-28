import React from "react";
import AppText from "../../components/AppText";
import FormInput from "../../components/FormInput";
import { spacing } from "../../themes/spacing";
import { usePostLoad, useSubmitLoad } from "./PostLoadContext";
import { StepShell, StepFooter, SectionCard, YesNoToggle, ChipRow, LOADING_TYPES, UNLOADING_TYPES, shared } from "./PostLoadUI";

// Step 4 - everything here is optional, so Continue never blocks.
export default function PostLoadRequirementsScreen({ navigation }) {
  const { formData, setField } = usePostLoad();
  const { submit, submitting, serverError } = useSubmitLoad(navigation);

  return (
    <StepShell
      step={4}
      title="Load Requirements"
      subtitle="Optional, but it helps drivers quote accurately"
      onBack={() => navigation.goBack()}
      error={serverError}
      footer={<StepFooter onContinue={() => navigation.navigate("PostLoadDocuments")} onSaveDraft={() => submit(true)} savingDraft={submitting === "draft"} />}
    >
      <SectionCard title="Driver Requirements">
        <YesNoToggle label="Team driver required?" value={formData.teamDriverRequired} onChange={(v) => setField("teamDriverRequired", v)} />
        <FormInput label="Other driver requirements" placeholder="e.g., TWIC card, clean MVR" value={formData.driverRequirements} onChangeText={(v) => setField("driverRequirements", v)} containerStyle={{ marginTop: spacing.sm, marginBottom: 0 }} />
      </SectionCard>

      <SectionCard title="Equipment Requirements">
        <FormInput label="Trailer Size" placeholder="e.g., 53 ft" value={formData.trailerSize} onChangeText={(v) => setField("trailerSize", v)} />
        <FormInput label="Special Equipment" placeholder="e.g., Pallet jack, ramps, straps" value={formData.specialEquipment} onChangeText={(v) => setField("specialEquipment", v)} containerStyle={{ marginBottom: 0 }} />
      </SectionCard>

      <SectionCard title="Special Handling">
        <AppText variant="label" style={shared.label}>Loading Type</AppText>
        <ChipRow options={LOADING_TYPES} selected={formData.loadingType} onSelect={(v) => setField("loadingType", v)} isObjectOptions />
        <AppText variant="label" style={[shared.label, { marginTop: spacing.base }]}>Unloading Type</AppText>
        <ChipRow options={UNLOADING_TYPES} selected={formData.unloadingType} onSelect={(v) => setField("unloadingType", v)} isObjectOptions />
        <FormInput label="Handling instructions" placeholder="Anything else a driver should know" value={formData.otherRequirements} onChangeText={(v) => setField("otherRequirements", v)} multiline numberOfLines={3} inputStyle={shared.textArea} containerStyle={{ marginTop: spacing.base, marginBottom: 0 }} />
      </SectionCard>

      <SectionCard title="Insurance / Qualification">
        <FormInput label="Insurance or qualification requirements" placeholder="e.g., $1M cargo insurance" value={formData.insuranceRequirements} onChangeText={(v) => setField("insuranceRequirements", v)} multiline numberOfLines={3} inputStyle={shared.textArea} containerStyle={{ marginBottom: 0 }} />
      </SectionCard>
    </StepShell>
  );
}
