import api from "./api.service";

const getMyInvoices = async () => {
  const res = await api.get("/invoices/my");
  return res.data;
};

const getInvoiceById = async (id) => {
  const res = await api.get(`/invoices/${id}`);
  return res.data;
};

const payInvoice = async (id, paymentData) => {
  const res = await api.post(`/invoices/${id}/pay`, paymentData);
  return res.data;
};

export default {
  getMyInvoices,
  getInvoiceById,
  payInvoice,
};
