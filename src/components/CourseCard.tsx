/**
 * Course Card Component — Vibrant & kid-friendly
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface CourseCardProps {
  title: string;
  description: string;
  category: string;
  totalLessons: number;
  estimatedDuration: string;
  icon?: string; // New icon prop
  progress?: number;
  onPress: () => void;
  variant?: 'list' | 'grid';
}

const categoryConfig: Record<string, { colors: readonly [string, string, ...string[]]; emoji: string }> = {
  english: { colors: COLORS.gradientPrimary, emoji: '📚' },
  abacus: { colors: COLORS.gradientWarm, emoji: '🧮' },
  vedic: { colors: COLORS.gradientSunset, emoji: '🔢' },
  coding: { colors: COLORS.gradientCool, emoji: '💻' },
  ai: { colors: ['#A855F7', '#EC4899'] as const, emoji: '🤖' },
};

export const CourseCard: React.FC<CourseCardProps> = ({
  title, description, category, totalLessons, estimatedDuration, icon, progress, onPress, variant = 'list'
}) => {
  const config = categoryConfig[category] || categoryConfig.english;
  const isGrid = variant === 'grid';
  
  // Use uploaded icon if available, otherwise fallback to emoji
  const hasIcon = !!icon;
  // Use expo-image for ALL formats including SVG
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isGrid ? styles.cardGrid : styles.cardList,
        SHADOWS.medium
      ]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <View style={[styles.header, isGrid && styles.headerGrid, !hasIcon && { backgroundColor: 'transparent' }]}>
        {!hasIcon && (
          <LinearGradient
            colors={config.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      
        {hasIcon && icon ? (
            <Image 
              source={{ uri: icon }} 
              style={[
                styles.courseIcon, 
                isGrid ? { width: '100%', height: '100%' } : { width: 80, height: 80 }
              ]} 
              contentFit="contain"
              transition={200}
            />
        ) : (
            <Text style={[styles.emoji, isGrid && styles.emojiGrid]}>{config.emoji}</Text>
        )}
        {!isGrid && !hasIcon && <Text style={styles.catLabel}>{category.toUpperCase()}</Text>}
      </View>

      <View style={[styles.body, isGrid && styles.bodyGrid]}>
        <Text style={[styles.title, isGrid && styles.titleGrid]} numberOfLines={2}>{title}</Text>
        {!isGrid && <Text style={styles.desc} numberOfLines={2}>{description}</Text>}

        <View style={[styles.meta, isGrid && styles.metaGrid]}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📖</Text>
            <Text style={styles.metaText}>{totalLessons} Lessons</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: RADIUS.lg, 
    overflow: 'hidden', 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardList: { width: '100%', flexDirection: 'row', height: 120 },
  cardGrid: { 
    flex: 1, 
    margin: 8, 
    height: 190, // Taller for grid
    flexDirection: 'column',
  },
  
  header: { 
    padding: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    width: 100, // Fixed width for list mode
    height: '100%', // Match container height
    overflow: 'hidden',
  },
  headerGrid: { 
    width: '100%', 
    height: 100, 
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emoji: { fontSize: 32 },
  emojiGrid: { fontSize: 48 },
  courseIcon: { width: '100%', height: '100%' },
  
  catLabel: { 
    color: COLORS.white, 
    fontSize: 10, 
    fontWeight: '800', 
    marginTop: 8,
    textAlign: 'center'
  },
  
  body: { flex: 1, padding: 12, justifyContent: 'center' },
  bodyGrid: { flex: 1, padding: 10, justifyContent: 'flex-start' },
  
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  titleGrid: { fontSize: 14, marginBottom: 4, textAlign: 'center' },
  
  desc: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  
  meta: { flexDirection: 'row', gap: 12 },
  metaGrid: { justifyContent: 'center', marginTop: 'auto' },
  
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 11, color: COLORS.textMuted },
});
