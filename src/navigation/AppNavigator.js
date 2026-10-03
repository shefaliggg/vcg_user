import React, { useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import MainTabNavigator from "./MainTabNavigator";
import { PostLoadProvider } from "../screens/postLoad/PostLoadContext";
import PostLoadDetailsScreen from "../screens/postLoad/PostLoadDetailsScreen";
import { PostLoadPickupScreen, PostLoadDeliveryScreen } from "../screens/postLoad/PostLoadStopScreens";
import PostLoadRequirementsScreen from "../screens/postLoad/PostLoadRequirementsScreen";
import PostLoadDocumentsScreen from "../screens/postLoad/PostLoadDocumentsScreen";
import PostLoadReviewScreen from "../screens/postLoad/PostLoadReviewScreen";
import PostLoadResultScreen from "../screens/postLoad/PostLoadResultScreen";
import BookingQuotesScreen from "../screens/BookingQuotesScreen";
import LoadDetailsScreen from "../screens/LoadDetailsScreen";
import MyBookingsScreen from "../screens/MyBookingsScreen";
import TrackingScreen from "../screens/TrackingScreen";
import ChatScreen from "../screens/ChatScreen";
import InvoiceScreen from "../screens/InvoiceScreen";
import RatingScreen from "../screens/RatingScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";

import BankTransferScreen from "../screens/BankTransferScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";

// CP Shipper (US) passwordless signup/login
import ChooseAuthMethodScreen from "../screens/auth/ChooseAuthMethodScreen";
import PhoneAuthScreen from "../screens/auth/PhoneAuthScreen";
import EmailAuthScreen from "../screens/auth/EmailAuthScreen";
import VerifyCodeScreen from "../screens/auth/VerifyCodeScreen";

// CP Shipper onboarding
import YourInformationScreen from "../screens/onboarding/YourInformationScreen";
import AccountTypeScreen from "../screens/onboarding/AccountTypeScreen";
import BusinessInformationScreen from "../screens/onboarding/BusinessInformationScreen";
import PrimaryLocationScreen from "../screens/onboarding/PrimaryLocationScreen";
import BillingInformationScreen from "../screens/onboarding/BillingInformationScreen";
import RequiredDocumentsScreen from "../screens/onboarding/RequiredDocumentsScreen";
import TermsAgreementsScreen from "../screens/onboarding/TermsAgreementsScreen";
import ESignatureScreen from "../screens/onboarding/ESignatureScreen";
import UnderReviewScreen from "../screens/onboarding/UnderReviewScreen";

import { fonts } from "../themes/typography";
import { colors } from "../themes/colors";
import shipperProfileService from "../services/shipperProfile.service";
import { routeForShipperStep } from "./onboardingSteps";
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  // React Navigation v7 themes require `fonts` too (bottom-tabs' label renderer
  // reads theme.fonts.medium) - keep DefaultTheme's, only colors are our brand.
};

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Login");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Show splash for at least 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(true);

      // Only accounts created via the new phone/email OTP flow carry a real
      // shipperOnboardingStep to resume - legacy password accounts (authMethod
      // 'password') always go straight to Home, never into onboarding or admin review.
      try {
        const profile = await shipperProfileService.getStatus();
        if (profile?.authMethod === "password") {
          setInitialRoute("Home");
        } else if (profile?.shipperOnboardingStep === "submitted") {
          // Submitted and awaiting/failed mandatory admin verification.
          setInitialRoute(profile.shipperApprovalStatus === "approved" ? "Home" : "UnderReview");
        } else if (profile?.shipperOnboardingStep && profile.shipperOnboardingStep !== "complete") {
          setInitialRoute(routeForShipperStep(profile.shipperOnboardingStep));
        } else {
          setInitialRoute("Home");
        }
      } catch (profileError) {
        // If the profile check fails, still let an authenticated user into the app.
        setInitialRoute("Home");
      }
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
    <NavigationContainer theme={navTheme}>
      <PostLoadProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,


          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "600",
            fontFamily:fonts.bold
          },
          headerShadowVisible: false,
        }}
        initialRouteName={isAuthenticated ? initialRoute : "Login"}
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
          options={{ title: "Forgot Password" ,headerShown: false }}

        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ title: "Reset Password" ,headerShown: false }}
        />

        {/* CP Shipper (US) passwordless signup/login */}
        <Stack.Screen name="ChooseAuthMethod" component={ChooseAuthMethodScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EmailAuth" component={EmailAuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ headerShown: false }} />

        {/* CP Shipper onboarding */}
        <Stack.Screen name="YourInformation" component={YourInformationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AccountType" component={AccountTypeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BusinessInformation" component={BusinessInformationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PrimaryLocation" component={PrimaryLocationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BillingInformation" component={BillingInformationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RequiredDocuments" component={RequiredDocumentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TermsAgreements" component={TermsAgreementsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ESignature" component={ESignatureScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UnderReview" component={UnderReviewScreen} options={{ headerShown: false, gestureEnabled: false }} />

        {/* App Screens */}
        <Stack.Screen
          name="Home"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        {/* Post Load: one screen per step, sharing state via PostLoadProvider. "Booking" stays the entry route. */}
        <Stack.Screen name="Booking" component={PostLoadDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoadPickup" component={PostLoadPickupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoadDelivery" component={PostLoadDeliveryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoadRequirements" component={PostLoadRequirementsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoadDocuments" component={PostLoadDocumentsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoadReview" component={PostLoadReviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostLoadResult" component={PostLoadResultScreen} options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="BookingQuotes"
          component={BookingQuotesScreen}
          options={{ title: "Quotes",headerShown: false }}
        />
        <Stack.Screen
          name="LoadDetails"
          component={LoadDetailsScreen}
          options={{ title: "Load Details", headerShown: false }}
        />
        <Stack.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          options={{ title: "Bookings",headerShown: false }}
          
        />
        <Stack.Screen
          name="Tracking"
          component={TrackingScreen}
          options={{ title: "Track Shipment",headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: "Chat", headerShown: false }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ title: "Notifications",headerShown: false }}
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
          name="notifications"
          component={NotificationScreen}
          options={{ title: "Notifications" }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />
       
        <Stack.Screen
          name="BankTransfer"
          component={BankTransferScreen}
          options={{ title: "Bank Transfer Details",headerShown:false }}
        />
      </Stack.Navigator>
      </PostLoadProvider>
    </NavigationContainer>
  );
}

