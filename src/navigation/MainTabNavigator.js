import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import LoadsScreen from "../screens/LoadsScreen";
import TrackingOverviewScreen from "../screens/TrackingOverviewScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AppHeader from "../components/AppHeader";
import { colors } from "../themes/colors";
import { fonts } from "../themes/typography";

const Tab = createBottomTabNavigator();

// Note: the tracking tab is named "TrackingTab", not "Tracking" - the outer Stack
// navigator (AppNavigator) already owns a "Tracking" screen (single-shipment detail
// with bookingId param). Reusing that name here would shadow it for every screen
// nested inside this tab navigator, breaking navigation.navigate("Tracking", {...}).
const TAB_ICONS = {
  Home: "home",
  Loads: "truck",
  TrackingTab: "map-pin",
  Messages: "message-circle",
  Profile: "user",
};

const TAB_TITLES = {
  Home: "Dashboard",
  Loads: "My Loads",
  TrackingTab: "Tracking",
  Messages: "Messages",
  Profile: "Profile",
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <AppHeader title={TAB_TITLES[route.name]} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 88 : 72,
          paddingBottom: Platform.OS === "ios" ? 22 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 11,
          lineHeight: 14,
        },
        tabBarIcon: ({ color, size }) => (
          <Feather name={TAB_ICONS[route.name]} color={color} size={size ?? 20} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Loads" component={LoadsScreen} />
      <Tab.Screen name="TrackingTab" component={TrackingOverviewScreen} options={{ tabBarLabel: "Tracking" }} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
