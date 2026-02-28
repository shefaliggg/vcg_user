import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from './api.service';

export const registerForPushNotifications = async () => {
  if (!Constants.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  await api.post('/users/save-push-token', { pushToken });

  return pushToken;
};