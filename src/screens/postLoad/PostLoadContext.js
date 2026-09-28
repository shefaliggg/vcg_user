import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import bookingService from "../../services/booking.service";
import getErrorMessage from "../../utils/errorHandler";

// One screen per step, all sharing this form state. The shipper posts the load;
// drivers quote; the shipper accepts a quote - so there is no rate/driver here.
export const POST_LOAD_STEPS = [
  { route: "Booking", label: "Load Details" },
  { route: "PostLoadPickup", label: "Pickup" },
  { route: "PostLoadDelivery", label: "Delivery" },
  { route: "PostLoadRequirements", label: "Requirements" },
  { route: "PostLoadDocuments", label: "Documents & Notes" },
  { route: "PostLoadReview", label: "Review & Post" },
];

export const initialFormData = {
  // Load details
  commodity: "",
  equipmentType: "",
  weight: "",
  pieces: "",
  packageType: "",
  length: "",
  width: "",
  height: "",
  totalQuantity: "",
  freightClass: "",
  hazmat: false,
  temperatureControlled: false,
  temperatureRequirements: "",
  oversized: false,
  liftgateRequired: false,

  // Pickup
  pickupLocation: { address: "", lat: null, lng: null },
  pickupDate: "",
  pickupTime: "",
  pickupWindowStart: "",
  pickupWindowEnd: "",
  pickupAppointmentRequired: false,
  pickupContactName: "",
  pickupContactPhone: "",
  pickupInstructions: "",

  // Delivery
  deliveryLocation: { address: "", lat: null, lng: null },
  deliveryDate: "",
  deliveryTime: "",
  deliveryWindowStart: "",
  deliveryWindowEnd: "",
  deliveryAppointmentRequired: false,
  deliveryContactName: "",
  deliveryContactPhone: "",
  deliveryInstructions: "",

  // Requirements (optional)
  teamDriverRequired: false,
  driverRequirements: "",
  trailerSize: "",
  specialEquipment: "",
  loadingType: "",
  unloadingType: "",
  otherRequirements: "",
  insuranceRequirements: "",

  // Documents & notes (optional)
  documents: [],
  specialInstructions: "",
  referenceNumber: "",
  internalNotes: "",
};

const required = (v) => (!String(v || "").trim() ? "Required" : null);

// Each returns { field: message }; empty object = valid.
export const validateDetails = (f) => {
  const e = {};
  if (required(f.commodity)) e.commodity = "Required";
  if (!f.equipmentType) e.equipmentType = "Select an equipment type";
  if (!String(f.weight).trim() || isNaN(Number(f.weight)) || Number(f.weight) <= 0) e.weight = "Enter a valid weight";
  return e;
};
export const validatePickup = (f) => {
  const e = {};
  if (required(f.pickupLocation.address)) e.pickupLocation = "Select a pickup address";
  if (required(f.pickupDate)) e.pickupDate = "Required";
  if (required(f.pickupTime)) e.pickupTime = "Required";
  return e;
};
export const validateDelivery = (f) => {
  const e = {};
  if (required(f.deliveryLocation.address)) e.deliveryLocation = "Select a delivery address";
  if (required(f.deliveryDate)) e.deliveryDate = "Required";
  if (required(f.deliveryTime)) e.deliveryTime = "Required";
  return e;
};

export const buildPayload = (f, isDraft) => ({
  pickupLocation: f.pickupLocation,
  deliveryLocation: f.deliveryLocation,
  pickupDate: f.pickupDate || undefined,
  deliveryDate: f.deliveryDate || undefined,
  pickupDetails: {
    time: f.pickupTime,
    windowStart: f.pickupWindowStart,
    windowEnd: f.pickupWindowEnd,
    appointmentRequired: f.pickupAppointmentRequired,
    contactName: f.pickupContactName,
    contactPhone: f.pickupContactPhone,
    instructions: f.pickupInstructions,
  },
  deliveryDetails: {
    time: f.deliveryTime,
    windowStart: f.deliveryWindowStart,
    windowEnd: f.deliveryWindowEnd,
    appointmentRequired: f.deliveryAppointmentRequired,
    contactName: f.deliveryContactName,
    contactPhone: f.deliveryContactPhone,
    instructions: f.deliveryInstructions,
  },
  truckType: f.equipmentType,
  loadDetails: {
    weight: f.weight ? Number(f.weight) : undefined,
    type: f.commodity,
    description: f.specialInstructions,
    pieces: f.pieces ? Number(f.pieces) : undefined,
    packageType: f.packageType ? f.packageType.toLowerCase() : undefined,
    dimensions: {
      length: f.length ? Number(f.length) : undefined,
      width: f.width ? Number(f.width) : undefined,
      height: f.height ? Number(f.height) : undefined,
    },
    totalQuantity: f.totalQuantity ? Number(f.totalQuantity) : undefined,
    freightClass: f.freightClass,
  },
  equipmentDetails: {
    trailerSize: f.trailerSize,
    temperatureRequirements: f.temperatureControlled ? f.temperatureRequirements || "Temperature controlled" : undefined,
    specialEquipment: f.specialEquipment,
  },
  requirements: {
    hazmat: f.hazmat,
    oversized: f.oversized,
    teamDriverRequired: f.teamDriverRequired,
    liftgateRequired: f.liftgateRequired,
    loadingType: f.loadingType || undefined,
    unloadingType: f.unloadingType || undefined,
    driverRequirements: f.driverRequirements,
    insuranceRequirements: f.insuranceRequirements,
    otherRequirements: f.otherRequirements,
  },
  documents: f.documents,
  referenceNumber: f.referenceNumber,
  internalNotes: f.internalNotes,
  isDraft,
});

const PostLoadContext = createContext(null);

export function PostLoadProvider({ children }) {
  const [formData, setFormData] = useState(initialFormData);
  const setField = useCallback((field, value) => setFormData((p) => ({ ...p, [field]: value })), []);
  const reset = useCallback(() => setFormData(initialFormData), []);
  const value = useMemo(() => ({ formData, setField, reset }), [formData, setField, reset]);
  return <PostLoadContext.Provider value={value}>{children}</PostLoadContext.Provider>;
}

export const usePostLoad = () => {
  const ctx = useContext(PostLoadContext);
  if (!ctx) throw new Error("usePostLoad must be used inside PostLoadProvider");
  return ctx;
};

// Save Draft / Post Load. Success goes to the result screen; failure is returned
// as a message for the caller to show inline.
export function useSubmitLoad(navigation) {
  const { formData } = usePostLoad();
  const [submitting, setSubmitting] = useState(null); // "draft" | "post" | null
  const [serverError, setServerError] = useState(null);

  const submit = useCallback(
    async (isDraft) => {
      setServerError(null);
      setSubmitting(isDraft ? "draft" : "post");
      try {
        const result = await bookingService.createBooking(buildPayload(formData, isDraft));
        navigation.navigate("PostLoadResult", { kind: isDraft ? "draft" : "posted", bookingId: result?.bookingId });
      } catch (err) {
        setServerError(getErrorMessage(err));
      } finally {
        setSubmitting(null);
      }
    },
    [formData, navigation]
  );

  return { submit, submitting, serverError };
}
