/**
 * Winner Slider — Auto-scrolling prize announcement carousel
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface Winner {
  userName: string;
  prize: string;
  prizeEmoji: string;
  week: string;
}

interface WinnerSliderProps {
  winners: Winner[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 60;

export const WinnerSlider: React.FC<WinnerSliderProps> = ({ winners }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (winners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % winners.length;
        scrollRef.current?.scrollTo({ x: next * (CARD_WIDTH + 12), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [winners.length]);

  if (!winners || winners.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Winners This Week 🏆</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {winners.map((w, i) => (
          <LinearGradient
            key={i}
            colors={['#FFD700', '#FFA000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { width: CARD_WIDTH }]}
          >
            <Text style={styles.prizeEmoji}>{w.prizeEmoji}</Text>
            <View style={styles.winnerInfo}>
              <Text style={styles.winnerName}>{w.userName}</Text>
              <Text style={styles.wonText}>won</Text>
              <Text style={styles.prizeName}>{w.prize}</Text>
            </View>
            <Text style={styles.weekText}>{w.week}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {winners.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentIndex === i && styles.dotActive]}
          />
        ))}
      </View>

      {/* Motivation */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.motivationCard}
      >
        <Text style={styles.motivationEmoji}>🚀</Text>
        <View style={styles.motivationText}>
          <Text style={styles.motivationTitle}>You can win too!</Text>
          <Text style={styles.motivationSub}>Keep practicing & improving daily</Text>
        </View>
        <Text style={styles.motivationArrow}>→</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF0F0', borderRadius: RADIUS.round,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF5350',
  },
  liveText: { fontSize: 10, fontWeight: '800', color: '#EF5350' },
  scrollContent: { paddingRight: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    borderRadius: RADIUS.xl, ...SHADOWS.medium,
  },
  prizeEmoji: { fontSize: 40, marginRight: 14 },
  winnerInfo: { flex: 1 },
  winnerName: { fontSize: 18, fontWeight: '800', color: '#5D4037' },
  wonText: { fontSize: 13, color: '#795548', marginVertical: 2 },
  prizeName: { fontSize: 16, fontWeight: '700', color: '#3E2723' },
  weekText: { fontSize: 10, color: '#795548', fontWeight: '600' },
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 6, marginTop: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border,
  },
  dotActive: { width: 20, backgroundColor: COLORS.primary },
  motivationCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: RADIUS.xl, marginTop: 12, ...SHADOWS.small,
  },
  motivationEmoji: { fontSize: 28, marginRight: 12 },
  motivationText: { flex: 1 },
  motivationTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  motivationSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  motivationArrow: { fontSize: 20, color: COLORS.white, fontWeight: '700' },
});
