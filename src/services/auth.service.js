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

// CP Shipper (US) passwordless signup/login — phone channel is stubbed server-side
// (501) until an SMS provider is wired in; email channel is fully functional.
// Shared with CP Driver's /api/auth/otp/* endpoints via role: 'user'.
const sendOtp = async (channel, identifier) => {
  const body = channel === "phone" ? { channel, phone: identifier, role: "user" } : { channel, email: identifier, role: "user" };
  const res = await api.post("/auth/otp/send", body);
  return res.data;
};

const verifyOtp = async (channel, identifier, code) => {
  const body = channel === "phone" ? { channel, phone: identifier, code, role: "user" } : { channel, email: identifier, code, role: "user" };
  const res = await api.post("/auth/otp/verify", body);
  if (res.data.success) {
    await AsyncStorage.setItem("authToken", res.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
  }
  return res.data;
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
  sendOtp,
  verifyOtp,
};
