import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api.service";
import { API_BASE_URL } from "../config/api.config";

// react-native-signature-canvas's onOK hands back a base64 data URI - this hits the
// JSON endpoint (upload.controller's uploadSignatureBase64) directly, unlike
// uploadSignature below which (mismatched) posts multipart form-data to the same route.
const uploadSignatureImage = async (base64Signature) => {
  const res = await api.post("/upload/signature-base64", { image: base64Signature });
  return res.data.fileUrl;
};

const uploadSignature = async (blob) => {
  const token = await AsyncStorage.getItem("authToken");
  
  const formData = new FormData();
  formData.append("signature", {
    uri: blob,
    type: "image/png",
    name: `signature-${Date.now()}.png`,
  });

  const response = await axios.post(`${API_BASE_URL}/upload/signature-base64`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.fileUrl;
};

const uploadPOD = async (blob) => {
  const token = await AsyncStorage.getItem("authToken");
  
  const formData = new FormData();
  formData.append("pod", {
    uri: blob,
    type: "image/png",
    name: `pod-${Date.now()}.png`,
  });

  const response = await axios.post(`${API_BASE_URL}/upload/pod`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.fileUrl;
};

const uploadBookingDocument = async (fileUri, fileName, mimeType) => {
  const token = await AsyncStorage.getItem("authToken");

  const formData = new FormData();
  formData.append("bookingDocument", {
    uri: fileUri,
    type: mimeType || "application/octet-stream",
    name: fileName || `document-${Date.now()}`,
  });

  const response = await axios.post(`${API_BASE_URL}/upload/booking-document`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default {
  uploadSignature,
  uploadSignatureImage,
  uploadPOD,
  uploadBookingDocument,
};
