import api from "./api.service";

// CP Shipper (US) onboarding — one call per step, each advances
// user.shipperOnboardingStep server-side. See TruckDoc/workflows/workflow-02-profile.html.

const getStatus = async () => {
  const res = await api.get("/users/me");
  return res.data.data;
};

const saveYourInfo = async ({ firstName, lastName, phone, email }) => {
  const res = await api.put("/users/shipper/your-info", { firstName, lastName, phone, email });
  return res.data.data;
};

const saveAccountType = async (accountType) => {
  const res = await api.put("/users/shipper/account-type", { accountType });
  return res.data.data;
};

const saveBusinessInfo = async ({ companyName, billingAddress, city, state, zip, phone, email }) => {
  const res = await api.put("/users/shipper/business-info", { companyName, billingAddress, city, state, zip, phone, email });
  return res.data.data;
};

const savePrimaryLocation = async ({ skipped, line1, city, state, zip }) => {
  const res = await api.put("/users/shipper/primary-location", { skipped, line1, city, state, zip });
  return res.data.data;
};

const saveBillingInfo = async ({ contactName, email, phone, paymentTerms, preferredPaymentMethod }) => {
  const res = await api.put("/users/shipper/billing-info", { contactName, email, phone, paymentTerms, preferredPaymentMethod });
  return res.data.data;
};

const getDocuments = async () => {
  const res = await api.get("/users/shipper/documents");
  return res.data.data;
};

const resolveDocumentMimeType = (asset = {}) => {
  const explicitMimeType = (asset.mimeType || "").toLowerCase();
  if (explicitMimeType && explicitMimeType !== "application/octet-stream") {
    return explicitMimeType;
  }
  // Pickers (especially on Android content:// URIs) sometimes hand back no mimeType
  // or a generic one - fall back to the file extension so the backend's fileFilter
  // doesn't reject a perfectly valid PDF/image outright.
  const fileName = (asset.name || asset.uri || "").toLowerCase();
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) return "image/heic";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
};

// files: { businessLicense?, insuranceCoi?, w9?, other? } — each { uri, name, mimeType, file? }
const uploadDocuments = async (files) => {
  const formData = new FormData();
  Object.entries(files).forEach(([field, asset]) => {
    if (!asset) return;
    if (asset.file) {
      // Web: expo-document-picker/image-picker give a real browser File for the blob:
      // URI. RN Web's FormData only understands an actual Blob/File, not the
      // {uri,name,type} placeholder object native RN expects - append it directly.
      formData.append(field, asset.file, asset.name || asset.file.name);
    } else {
      formData.append(field, {
        uri: asset.uri,
        name: asset.name || `${field}-${Date.now()}`,
        type: resolveDocumentMimeType(asset),
      });
    }
  });
  const res = await api.put("/users/shipper/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

const acceptTerms = async () => {
  const res = await api.post("/users/shipper/accept-terms");
  return res.data.data;
};

const submitApplication = async () => {
  const res = await api.post("/users/shipper/submit-application", { agreedToTerms: true });
  return res.data.data;
};

export default {
  getStatus,
  saveYourInfo,
  saveAccountType,
  saveBusinessInfo,
  savePrimaryLocation,
  saveBillingInfo,
  getDocuments,
  uploadDocuments,
  acceptTerms,
  submitApplication,
};
