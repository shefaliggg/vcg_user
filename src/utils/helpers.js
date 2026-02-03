/**
 * Utility functions for TruckUserExpo
 */

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
};

// Format currency
export const formatCurrency = (amount) => {
  if (!amount) return "$0.00";
  return `$${parseFloat(amount).toFixed(2)}`;
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
};
