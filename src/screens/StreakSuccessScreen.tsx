/**
 * Streak Success Screen — Celebration with Lottie confetti
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { celebration } from '../constants/animations';
import { Button } from '../components/Button';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const MILESTONES = [7, 14, 21, 30, 50, 75, 100];

export default function StreakSuccessScreen() {
  const router = useRouter();
  const { day } = useLocalSearchParams<{ day: string }>();
  const currentDay = parseInt(day || '1', 10);

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1, friction: 4, tension: 60, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const isMilestone = MILESTONES.includes(currentDay);
  const is100Day = currentDay >= 100;

  const getMessage = () => {
    if (is100Day) return '🏆 LEGENDARY! 100-Day Champion!';
    if (currentDay >= 75) return '💎 Diamond Learner! Almost there!';
    if (currentDay >= 50) return '⭐ Half century! Incredible!';
    if (currentDay >= 30) return '🔥 30 days strong!';
    if (currentDay >= 21) return '🌟 3 weeks! Habit formed!';
    if (currentDay >= 14) return '✨ 2 weeks champion!';
    if (currentDay >= 7) return '🎯 1 week streak!';
    if (currentDay >= 3) return '💪 You are on a roll!';
    return '🎉 Great start!';
  };

  return (
    <LinearGradient
      colors={is100Day ? ['#FFD700', '#FFA000', '#FF6F00'] : COLORS.gradientSuccess}
      style={styles.container}
    >
      {/* Lottie Celebration */}
      <LottieView
        source={celebration}
        autoPlay
        loop={false}
        style={styles.lottie}
      />

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        {/* Big Day Number */}
        <View style={styles.dayCircle}>
          <Text style={styles.dayNumber}>{currentDay}</Text>
          <Text style={styles.dayLabel}>DAY</Text>
        </View>

        {/* Message */}
        <Text style={styles.message}>{getMessage()}</Text>

        {isMilestone && (
          <View style={styles.milestoneBadge}>
            <Text style={styles.milestoneText}>🏅 Milestone Reached!</Text>
          </View>
        )}

        {/* Progress to next milestone */}
        {!is100Day && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              Next milestone: Day {MILESTONES.find((m) => m > currentDay) || 100}
            </Text>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (currentDay / (MILESTONES.find((m) => m > currentDay) || 100)) * 100,
                    100
                  )}%`,
                },
              ]} />
            </View>
          </View>
        )}
      </Animated.View>

      <View style={styles.btnRow}>
        <Button
          title="Continue Learning 📚"
          onPress={() => router.replace('/(tabs)')}
          fullWidth
          size="large"
          gradient={['#ffffff', '#f0f0f0']}
          textStyle={{ color: COLORS.primary }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lottie: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  dayCircle: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
  },
  dayNumber: { fontSize: 52, fontWeight: 'bold', color: COLORS.white },
  dayLabel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: -4 },
  message: {
    fontSize: 24, fontWeight: '700', color: COLORS.white,
    textAlign: 'center', marginBottom: 16,
  },
  milestoneBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.round,
    paddingHorizontal: 20, paddingVertical: 8, marginBottom: 16,
  },
  milestoneText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  progressSection: { width: '100%', marginTop: 20 },
  progressLabel: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 8,
  },
  progressBar: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.white, borderRadius: 4,
  },
  btnRow: { position: 'absolute', bottom: 50, left: 30, right: 30 },
});
