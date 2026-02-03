import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://172.20.10.6:5000/api";

const uploadSignature = async (blob) => {
  const token = await AsyncStorage.getItem("authToken");
  
  const formData = new FormData();
  formData.append("signature", {
    uri: blob,
    type: "image/png",
    name: `signature-${Date.now()}.png`,
  });

  const response = await axios.post(`${API_BASE_URL}/upload/signature`, formData, {
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

export default {
  uploadSignature,
  uploadPOD,
};
