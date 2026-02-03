import api from "./api.service";

const trackTrip = async (tripId) => {
  const res = await api.get(`/trips/${tripId}/track`);
  return res.data;
};

const trackByBooking = async (bookingId) => {
  const res = await api.get(`/trips/booking/${bookingId}`);
  return res.data;
};

const getMyTrips = async () => {
  const res = await api.get("/trips/my");
  return res.data;
};

const getTripById = async (id) => {
  const res = await api.get(`/trips/${id}`);
  return res.data;
};

export default {
  trackTrip,
  trackByBooking,
  getMyTrips,
  getTripById,
};
