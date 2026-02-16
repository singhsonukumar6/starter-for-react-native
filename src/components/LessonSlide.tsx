/**
 * Lesson Slide Component — Sololearn-style learn cards
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface SlideData {
  type: string; // "text" | "example" | "tip" | "highlight"
  title: string;
  content: string;
  emoji?: string;
}

interface LessonSlideProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
}

const TYPE_CONFIG: Record<string, {
  colors: readonly [string, string, ...string[]];
  bg: string;
  icon: string;
  label: string;
}> = {
  text: {
    colors: COLORS.gradientPrimary,
    bg: COLORS.primaryBg,
    icon: '📝',
    label: 'LEARN',
  },
  example: {
    colors: COLORS.gradientCool,
    bg: '#E3F2FD',
    icon: '💡',
    label: 'EXAMPLE',
  },
  tip: {
    colors: COLORS.gradientSuccess,
    bg: '#E8F5E9',
    icon: '⭐',
    label: 'PRO TIP',
  },
  highlight: {
    colors: COLORS.gradientWarm,
    bg: '#FFF3E0',
    icon: '🔥',
    label: 'KEY POINT',
  },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LessonSlide: React.FC<LessonSlideProps> = ({
  slide, slideIndex, totalSlides,
}) => {
  const config = TYPE_CONFIG[slide.type] || TYPE_CONFIG.text;

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH - 40 }]}>
      {/* Type badge */}
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.badge}
      >
        <Text style={styles.badgeIcon}>{config.icon}</Text>
        <Text style={styles.badgeText}>{config.label}</Text>
      </LinearGradient>

      {/* Content card */}
      <View style={[styles.card, { backgroundColor: config.bg }]}>
        {slide.emoji && (
          <Text style={styles.emoji}>{slide.emoji}</Text>
        )}

        <Text style={styles.title}>{slide.title}</Text>

        <Text style={styles.content}>{slide.content}</Text>
      </View>

      {/* Slide counter */}
      <View style={styles.counter}>
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === slideIndex && styles.dotActive]}
            />
          ))}
        </View>
        <Text style={styles.slideNum}>
          {slideIndex + 1} / {totalSlides}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: RADIUS.round, marginBottom: 20, alignSelf: 'center',
  },
  badgeIcon: { fontSize: 14 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  card: {
    width: '100%', borderRadius: RADIUS.xxl, padding: 28,
    minHeight: 300, justifyContent: 'center', ...SHADOWS.medium,
  },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 24, fontWeight: '700', color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: 16, lineHeight: 32,
  },
  content: {
    fontSize: 16, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 26,
  },
  counter: { alignItems: 'center', marginTop: 20 },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border,
  },
  dotActive: { width: 20, backgroundColor: COLORS.primary },
  slideNum: { fontSize: 12, color: COLORS.textMuted },
});
