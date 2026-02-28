import api from "./api.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const login = async (data) => {
  const res = await api.post("/auth/login", data);
  await AsyncStorage.setItem("authToken", res.data.token);
  await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data.user;
};

const register = async (data) => {
  const res = await api.post("/auth/register", { ...data, role: "user" });
  await AsyncStorage.setItem("authToken", res.data.token);
  await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data.user;
};

const logout = async () => {
  await AsyncStorage.removeItem("authToken");
  await AsyncStorage.removeItem("user");
};

const getCurrentUser = async () => {
  const res = await api.get("/auth/me");
  const user = res.data?.user || res.data?.data || res.data;
  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
};

// Placeholder stubs for unimplemented flows to avoid runtime errors


const verifyResetOtp = async (data) => {
  return api.post("/auth/verify-reset-otp", data);
};

const forgotPassword = async (data) => {
  return api.post("/auth/forgot-password", data);
};


export default {
  login,
  register,
  logout,
  getCurrentUser,
  verifyResetOtp,
  forgotPassword,
  
  
};
