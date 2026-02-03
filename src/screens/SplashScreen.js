import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <View style={styles.gradient}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Logo Circle */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>🚚</Text>
          </View>
          {/* Main Text */}
          <Text style={styles.mainText}>VCG</Text>
          <Text style={styles.subText}>USER</Text>
          {/* Tagline */}
          <Text style={styles.tagline}>Professional Transport Solutions</Text>
        </Animated.View>
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7b2ff2',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      logoLetter: {
        fontSize: 56,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 1,
      },
      mainText: {
        fontSize: 56,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 3,
        marginBottom: 8,
      },
      subText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 4,
        marginBottom: 24,
      },
      tagline: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
        letterSpacing: 0.5,
      },
      loadingContainer: {
        position: 'absolute',
        bottom: 60,
        flexDirection: 'row',
        gap: 8,
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
      },
      dot1: {
        opacity: 0.4,
      },
      dot2: {
        opacity: 0.7,
      },
      dot3: {
          opacity: 1,
        },
    loader: {
      marginTop: 20,
    },
  });
