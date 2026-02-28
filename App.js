/**
 * VCG Transport - TruckUser App
 * User/Shipper Mobile Application
 *
 * JavaScript ONLY - No TypeScript
 * Frontend ONLY - No Backend Logic
 *
 * @format
 */

import React from "react";
import { useEffect } from "react";
import { StatusBar, View } from "react-native";
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AppNavigator from "./src/navigation/AppNavigator";
import { DeviceEventEmitter } from "react-native";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
export default function App() {

  

  
  useEffect(() => {

    const receivedSubscription =
      Notifications.addNotificationReceivedListener(() => {
        DeviceEventEmitter.emit("refreshNotifications");
      });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(response => {

        const data = response.notification.request.content.data;

        console.log("Notification tapped:", data);

        DeviceEventEmitter.emit("openNotification", data);

      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };

  }, []);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Wait until font loads
  }
  return (

    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />

      <AppNavigator />

    </View>

  );
}
