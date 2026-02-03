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
import { StatusBar, View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      <AppNavigator />
    </View>
  );
}
