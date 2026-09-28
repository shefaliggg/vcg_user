import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AppText from "../../components/AppText";
import FormInput from "../../components/FormInput";
import { colors } from "../../themes/colors";
import { spacing } from "../../themes/spacing";
import { usePostLoad, useSubmitLoad, validateDetails } from "./PostLoadContext";
import { StepShell, StepFooter, SectionCard, YesNoToggle, ChipRow, EQUIPMENT_TYPES, PACKAGE_TYPES, shared } from "./PostLoadUI";

// Step 1 - also where a fresh Post Load session starts, so it clears any old form.
export default function PostLoadDetailsScreen({ navigation }) {
  const { formData, setField, reset } = usePostLoad();
  const { submit, submitting, serverError } = useSubmitLoad(navigation);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    reset();
  }, [reset]);

  const change = (field, value) => {
    setField(field, value);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const next = () => {
    const e = validateDetails(formData);
    setErrors(e);
    if (Object.keys(e).length === 0) navigation.navigate("PostLoadPickup");
  };

  return (
    <StepShell
      step={1}
      title="Load Details"
      subtitle="Tell drivers what needs to move"
      onBack={() => navigation.goBack()}
      error={serverError}
      footer={<StepFooter onContinue={next} onSaveDraft={() => submit(true)} savingDraft={submitting === "draft"} />}
    >
      <SectionCard title="Load Information">
        <FormInput label="Commodity / Load Description" required placeholder="e.g., Electronics, Furniture" value={formData.commodity} onChangeText={(v) => change("commodity", v)} error={errors.commodity} />

        <AppText variant="label" style={shared.label}>
          Equipment Type <AppText style={{ color: colors.error }}>*</AppText>
        </AppText>
        <ChipRow options={EQUIPMENT_TYPES} selected={formData.equipmentType} onSelect={(v) => change("equipmentType", v)} />
        {!!errors.equipmentType && <AppText style={shared.errorText}>{errors.equipmentType}</AppText>}

        <View style={[shared.row, { marginTop: spacing.base }]}>
          <FormInput containerStyle={shared.half} label="Weight (lbs)" required keyboardType="numeric" placeholder="e.g., 42000" value={formData.weight} onChangeText={(v) => change("weight", v)} error={errors.weight} />
          <FormInput containerStyle={shared.half} label="Pieces / Units" keyboardType="numeric" placeholder="e.g., 24" value={formData.pieces} onChangeText={(v) => change("pieces", v)} />
        </View>
      </SectionCard>

      <SectionCard title="Special Requirements">
        <YesNoToggle label="Hazmat?" value={formData.hazmat} onChange={(v) => change("hazmat", v)} />
        <YesNoToggle label="Temperature controlled?" value={formData.temperatureControlled} onChange={(v) => change("temperatureControlled", v)} />
        {formData.temperatureControlled && (
          <FormInput label="Temperature Requirements" placeholder="e.g., Keep at 34–38°F" value={formData.temperatureRequirements} onChangeText={(v) => change("temperatureRequirements", v)} />
        )}
        <YesNoToggle label="Oversized?" value={formData.oversized} onChange={(v) => change("oversized", v)} />
        <YesNoToggle label="Liftgate required?" value={formData.liftgateRequired} onChange={(v) => change("liftgateRequired", v)} />
      </SectionCard>

      <SectionCard title="More Load Info" subtitle="Optional">
        <AppText variant="label" style={shared.label}>Package Type</AppText>
        <ChipRow options={PACKAGE_TYPES} selected={formData.packageType} onSelect={(v) => change("packageType", v)} />

        <AppText variant="label" style={[shared.label, { marginTop: spacing.base }]}>Dimensions — L × W × H (in.)</AppText>
        <View style={shared.row}>
          <FormInput containerStyle={shared.third} placeholder="Length" keyboardType="numeric" value={formData.length} onChangeText={(v) => change("length", v)} />
          <FormInput containerStyle={shared.third} placeholder="Width" keyboardType="numeric" value={formData.width} onChangeText={(v) => change("width", v)} />
          <FormInput containerStyle={shared.third} placeholder="Height" keyboardType="numeric" value={formData.height} onChangeText={(v) => change("height", v)} />
        </View>

        <View style={shared.row}>
          <FormInput containerStyle={shared.half} label="Total Quantity" keyboardType="numeric" placeholder="e.g., 24" value={formData.totalQuantity} onChangeText={(v) => change("totalQuantity", v)} />
          <FormInput containerStyle={shared.half} label="Freight Class / NMFC" placeholder="e.g., Class 70" value={formData.freightClass} onChangeText={(v) => change("freightClass", v)} />
        </View>
      </SectionCard>
    </StepShell>
  );
}
