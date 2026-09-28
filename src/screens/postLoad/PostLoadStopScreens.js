import React, { useState } from "react";
import { View } from "react-native";
import FormInput from "../../components/FormInput";
import DateTimeField from "../../components/DateTimeField";
import { spacing } from "../../themes/spacing";
import { usePostLoad, useSubmitLoad, validatePickup, validateDelivery } from "./PostLoadContext";
import { StepShell, StepFooter, SectionCard, YesNoToggle, AddressField, shared } from "./PostLoadUI";

// Pickup and Delivery are the same form over different fields, so one component
// serves both; the exported screens just pick the prefix.
const CONFIG = {
  pickup: {
    step: 2,
    title: "Pickup",
    subtitle: "Where and when the driver collects the load",
    addressLabel: "Pickup Address",
    addressPlaceholder: "Search pickup address",
    validate: validatePickup,
    next: "PostLoadDelivery",
    contactPlaceholders: ["John Doe", "(555) 123-4567"],
  },
  delivery: {
    step: 3,
    title: "Delivery",
    subtitle: "Where and when the load is dropped off",
    addressLabel: "Delivery Address",
    addressPlaceholder: "Search delivery address",
    validate: validateDelivery,
    next: "PostLoadRequirements",
    contactPlaceholders: ["Jane Smith", "(555) 987-6543"],
  },
};

function StopStep({ kind, navigation }) {
  const cfg = CONFIG[kind];
  const { formData, setField } = usePostLoad();
  const { submit, submitting, serverError } = useSubmitLoad(navigation);
  const [errors, setErrors] = useState({});
  const key = (name) => `${kind}${name}`; // pickupDate, deliveryDate, ...

  const change = (field, value) => {
    setField(field, value);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const next = () => {
    const e = cfg.validate(formData);
    setErrors(e);
    if (Object.keys(e).length === 0) navigation.navigate(cfg.next);
  };

  return (
    <StepShell
      step={cfg.step}
      title={cfg.title}
      subtitle={cfg.subtitle}
      onBack={() => navigation.goBack()}
      error={serverError}
      footer={<StepFooter onContinue={next} onSaveDraft={() => submit(true)} savingDraft={submitting === "draft"} />}
    >
      <SectionCard title="Location">
        <AddressField
          label={cfg.addressLabel}
          placeholder={cfg.addressPlaceholder}
          value={formData[key("Location")]}
          onSelect={(place) => change(key("Location"), place)}
          error={errors[key("Location")]}
        />
      </SectionCard>

      <SectionCard title="Date & Time">
        <View style={shared.row}>
          <DateTimeField containerStyle={shared.half} label={`${cfg.title} Date`} required mode="date" minimumDate={new Date()} value={formData[key("Date")]} onChange={(v) => change(key("Date"), v)} error={errors[key("Date")]} />
          <DateTimeField containerStyle={shared.half} label={`${cfg.title} Time`} required mode="time" value={formData[key("Time")]} onChange={(v) => change(key("Time"), v)} error={errors[key("Time")]} />
        </View>
        <View style={shared.row}>
          <DateTimeField containerStyle={shared.half} label="Window Start" mode="time" value={formData[key("WindowStart")]} onChange={(v) => change(key("WindowStart"), v)} />
          <DateTimeField containerStyle={shared.half} label="Window End" mode="time" value={formData[key("WindowEnd")]} onChange={(v) => change(key("WindowEnd"), v)} />
        </View>
        <YesNoToggle label="Appointment required?" value={formData[key("AppointmentRequired")]} onChange={(v) => change(key("AppointmentRequired"), v)} />
      </SectionCard>

      <SectionCard title="Contact & Instructions" subtitle="Optional">
        <View style={shared.row}>
          <FormInput containerStyle={shared.half} label="Contact Name" placeholder={cfg.contactPlaceholders[0]} value={formData[key("ContactName")]} onChangeText={(v) => change(key("ContactName"), v)} />
          <FormInput containerStyle={shared.half} label="Contact Phone" placeholder={cfg.contactPlaceholders[1]} keyboardType="phone-pad" value={formData[key("ContactPhone")]} onChangeText={(v) => change(key("ContactPhone"), v)} />
        </View>
        <FormInput label={`${cfg.title} Instructions`} placeholder="Dock #, gate code, etc." value={formData[key("Instructions")]} onChangeText={(v) => change(key("Instructions"), v)} multiline numberOfLines={3} inputStyle={shared.textArea} containerStyle={{ marginBottom: spacing.xs }} />
      </SectionCard>
    </StepShell>
  );
}

export const PostLoadPickupScreen = (props) => <StopStep kind="pickup" {...props} />;
export const PostLoadDeliveryScreen = (props) => <StopStep kind="delivery" {...props} />;
