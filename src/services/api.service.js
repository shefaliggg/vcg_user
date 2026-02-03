import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
// http://172.20.10.6:5000/api

const api = axios.create({
  baseURL: "http://3.80.95.96:5000/api",
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically clear auth on 401 to avoid stuck state
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("user");
      } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default api;
