import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://54.174.219.57:5000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function register(payload) {
  const res = await client.post('/api/auth/register', payload);
  return res.data;
}

export async function login(payload) {
  const res = await client.post('/api/auth/login', payload);
  return res.data;
}

export async function me(token) {
  const res = await client.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function verifyPhone(payload) {
  const res = await client.post('/api/auth/verify-phone', payload);
  return res.data;
}

export async function verifyEmail(payload) {
  const res = await client.post('/api/auth/verify-email', payload);
  return res.data;
}

export async function updatePassword(token, payload) {
  const res = await client.put('/api/auth/update-password', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function forgotPassword(payload) {
  const res = await client.post('/api/auth/forgot-password', payload);
  return res.data;
}
