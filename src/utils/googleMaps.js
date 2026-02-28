
// Centralized Google Maps Web API key and helpers

import Constants from 'expo-constants';
// For Expo SDK 49+, use expoConfig
export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY;


export const geocodeUrl = (address) =>
  `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;


export const directionsUrl = ({ originLat, originLng, destLat, destLng }) =>
  `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${GOOGLE_MAPS_API_KEY}`;


export default {
  GOOGLE_MAPS_API_KEY,
  geocodeUrl,
  directionsUrl
};
