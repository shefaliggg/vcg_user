import api from "./api.service";

const submitRating = async (tripId, rating, comment) => {
  const res = await api.post("/ratings", {
    tripId,
    rating,
    comment,
  });

  return res.data;
};

// ✅ Check If Already Rated
const checkIfRated = async (tripId) => {
  const response = await api.get(`/ratings/check/${tripId}`);
  return response.data;
}

export default {
  submitRating,
  checkIfRated,
};