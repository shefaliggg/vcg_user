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
const forgotPassword = async (_data) => {
  return { message: "If an account exists, a reset link was sent." };
};

const resetPassword = async (_token, _data) => {
  return { message: "Password reset is not enabled in this build." };
};

const updatePassword = async (_data) => {
  return { message: "Update password is not enabled in this build." };
};

const verifyEmail = async (_data) => {
  return { message: "Email verification is not required." };
};

const verifyPhone = async (_data) => {
  return { message: "Phone verification is not required." };
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  verifyPhone,
};
