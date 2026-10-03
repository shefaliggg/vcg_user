import api from "./api.service";

const getMessages = async (tripId) => {
  const res = await api.get(`/trips/${tripId}/messages`);
  return res.data;
};

const sendMessage = async (tripId, text) => {
  const res = await api.post(`/trips/${tripId}/messages`, { text });
  return res.data;
};

const getConversations = async () => {
  const res = await api.get("/messages/conversations");
  return res.data;
};

const getUnreadCount = async () => {
  const res = await api.get("/messages/unread-count");
  return res.data;
};

export default { getMessages, sendMessage, getConversations, getUnreadCount };
