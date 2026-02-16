/**
 * Streak Display Component with fire animation
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { fireStreak } from '../constants/animations';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface StreakDisplayProps {
  currentDay: number;
  totalDays?: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentDay, totalDays = 100,
}) => {
  const progress = Math.min((currentDay / totalDays) * 100, 100);

  return (
    <View style={[styles.wrap, SHADOWS.large]}>
      <LinearGradient
        colors={COLORS.gradientWarm}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.top}>
          <View style={styles.fireWrap}>
            <LottieView source={fireStreak} autoPlay loop style={styles.fire} />
          </View>
          <View style={styles.stats}>
            <Text style={styles.dayNum}>{currentDay}</Text>
            <Text style={styles.dayLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentDay} / {totalDays} days</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 20 },
  gradient: { padding: 24 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  fireWrap: { width: 60, height: 70 },
  fire: { width: 60, height: 70 },
  stats: { marginLeft: 16 },
  dayNum: { fontSize: 48, fontWeight: 'bold', color: COLORS.white },
  dayLabel: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: -4 },
  progressBg: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.white, borderRadius: 4,
  },
  progressText: {
    fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'right',
  },
});
