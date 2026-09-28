import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";



import AppText from "../components/AppText";

import { Feather } from "@expo/vector-icons";
import { colors } from "../themes/colors";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.primary }]}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Circle */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <Feather name="truck" size={44} color={colors.primary} />
          </View>
        </View>

        {/* Brand */}
        <AppText weight="bold" style={styles.mainText}>
          CP
        </AppText>

        <AppText weight="semiBold" style={styles.subText}>
          SHIPPER
        </AppText>

        <AppText style={styles.tagline}>
          Professional Transport Solutions
        </AppText>
      </Animated.View>

      {/* Loading Dots */}
      <View style={styles.loadingContainer}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    alignItems: "center",
  },

  logoWrapper: {
    marginBottom: 36,
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  logoIcon: {
    fontSize: 52,
    color: "#fff",
  },

  mainText: {
    fontSize: 48,
    letterSpacing: 3,
    color: "#fff",
  },

  subText: {
    fontSize: 24,
    letterSpacing: 6,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  tagline: {
    marginTop: 16,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },

  loadingContainer: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    gap: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
  },

  dot1: { opacity: 0.3 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 1 },
  logoCircle: {
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
},
});


