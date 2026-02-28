import api from "./api.service";

const createBooking = async (data) => {
  const res = await api.post("/bookings", data);
  return res.data;
};

const getMyBookings = async () => {
  const res = await api.get("/bookings/my");
  return res.data;
};

const getBookingById = async (id) => {
  const res = await api.get(`/bookings/${id}`);
  return res.data;
};

const cancelBooking = async (id) => {
  const res = await api.put(`/bookings/${id}/cancel`);
  return res.data;
};

const selectQuote = async (bookingId, quoteIndex) => {
  const res = await api.post(`/bookings/${bookingId}/select-quote`, {
    quoteIndex
  });
  return res.data;
};

const userSignRateConfirmation = async (bookingId, signature) => {
  const res = await api.post(
    `/bookings/${bookingId}/rate-confirmation/user-sign`,
    { signature }   // ✅ MATCH BACKEND
  );
  return res.data;
};

const driverAcceptRateConfirmation = async (bookingId, signatureUrl) => {
  const res = await api.post(
    `/bookings/${bookingId}/rate-confirmation/driver-accept`,
    { signatureUrl }
  );
  return res.data;
};


export default {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  selectQuote,
  userSignRateConfirmation,
  driverAcceptRateConfirmation,
  
};
