import api from "./api.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getProfile = async () => {
  const res = await api.get("/users/me");
  const user = res.data?.user || res.data?.data || res.data;
  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
};

const updateProfile = async (userId, data) => {
  const res = await api.put(`/users/${userId}`, data);
  const user = res.data?.user || res.data?.data || res.data;
  await AsyncStorage.setItem("user", JSON.stringify(user));
  return user;
};

const changePassword = async (userId, data) => {
  const res = await api.put(`/users/${userId}/password`, data);
  return res.data;
};

const getCompanyProfile = async () => {
  const res = await api.get("/users/profile/company");
  return res.data;
};

const updateCompanyProfile = async (data) => {
  const res = await api.put("/users/profile/company", data);
  return res.data;
};

const getAdminProfile = async () => {
  const res = await api.get("/users/profile/admin");
  return res.data;
};

const updateAdminProfile = async (data) => {
  const res = await api.put("/users/profile/admin", data);
  return res.data;
};

export default {
  getProfile,
  updateProfile,
  changePassword,
  getCompanyProfile,
  updateCompanyProfile,
  getAdminProfile,
  updateAdminProfile,
};
