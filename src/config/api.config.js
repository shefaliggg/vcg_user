import { Platform } from 'react-native';

const localDefault = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000'
  : Platform.OS === 'ios'
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';

export const API_ORIGIN = process.env.EXPO_PUBLIC_API_URL || (
  process.env.EXPO_PUBLIC_API_MODE === 'production'
    ? 'http://54.174.219.57:5000'
    : localDefault
);
export const API_BASE_URL = `${API_ORIGIN}/api`;

export default API_ORIGIN;
