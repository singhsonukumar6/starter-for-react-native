/**
 * Splash Screen — Animated Lottie + branding
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { lemonBounce } from '../constants/animations';
import { COLORS } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(() => {
      if (isSignedIn) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn]);

  return (
    <LinearGradient
      colors={COLORS.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.lottieWrap}>
          <LottieView source={lemonBounce} autoPlay loop style={styles.lottie} />
        </View>
        <Text style={styles.logo}>🍋</Text>
        <Text style={styles.title}>LemoLearn</Text>
        <Text style={styles.subtitle}>Learn. Grow. Succeed.</Text>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { opacity: fadeAnim },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  lottieWrap: { width: 120, height: 120, marginBottom: 10 },
  lottie: { width: 120, height: 120 },
  logo: { fontSize: 72, marginBottom: 8 },
  title: { fontSize: 44, fontWeight: 'bold', color: COLORS.white, letterSpacing: -1 },
  subtitle: {
    fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 8, letterSpacing: 2,
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 48 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
