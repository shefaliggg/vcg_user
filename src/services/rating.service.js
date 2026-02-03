import api from "./api.service";

const createRating = async (data) => {
  const res = await api.post("/ratings", data);
  return res.data;
};

const getMyRatings = async () => {
  const res = await api.get("/ratings/my");
  return res.data;
};

const getRatingById = async (id) => {
  const res = await api.get(`/ratings/${id}`);
  return res.data;
};

export default {
  createRating,
  getMyRatings,
  getRatingById,
};
