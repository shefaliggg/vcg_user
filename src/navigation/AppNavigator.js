import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import BookingScreen from "../screens/BookingScreen";
import BookingQuotesScreen from "../screens/BookingQuotesScreen";
import SignatureScreen from "../screens/SignatureScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import TrackingScreen from "../screens/TrackingScreen";
import InvoiceScreen from "../screens/InvoiceScreen";
import RatingScreen from "../screens/RatingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import CompanyProfileScreen from "../screens/CompanyProfileScreen";


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Show splash for at least 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      const token = await AsyncStorage.getItem("authToken");
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#7b2ff2",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
        initialRouteName={isAuthenticated ? "Home" : "Login"}
      >
        {/* Auth Screens */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Forgot Password" }}
        />

        {/* App Screens */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: "New Booking" }}
        />
        <Stack.Screen
          name="BookingQuotes"
          component={BookingQuotesScreen}
          options={{ title: "Quotes" }}
        />
        <Stack.Screen
          name="Signature"
          component={SignatureScreen}
          options={{ title: "Sign Document" }}
        />
        <Stack.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          options={{ title: "My Bookings" }}
        />
        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{ title: "Track Shipment" }}
        />
        <Stack.Screen
          name="Invoices"
          component={InvoiceScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Rating"
          component={RatingScreen}
          options={{ title: "Rate Trip" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "My Profile" }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CompanyProfile"
          component={CompanyProfileScreen}
          options={{ title: "Company Profile" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

