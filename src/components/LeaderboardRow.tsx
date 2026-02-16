/**
 * Leaderboard Row Component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  xp: number;
  level: number;
  userClass: number;
  isCurrentUser?: boolean;
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  rank, name, xp, level, userClass, isCurrentUser,
}) => {
  const isTop3 = rank <= 3;

  const inner = (
    <View style={[
      styles.row,
      isCurrentUser && styles.currentUser,
      isTop3 && !isCurrentUser && styles.top3,
    ]}>
      {/* Rank */}
      <View style={styles.rankWrap}>
        {RANK_MEDALS[rank] ? (
          <Text style={styles.medal}>{RANK_MEDALS[rank]}</Text>
        ) : (
          <Text style={styles.rankNum}>{rank}</Text>
        )}
      </View>

      {/* Avatar initial */}
      <View style={[
        styles.avatar,
        isTop3 && { backgroundColor: COLORS.primary },
      ]}>
        <Text style={[styles.avatarText, isTop3 && { color: COLORS.white }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name & class */}
      <View style={styles.info}>
        <Text style={[styles.name, isCurrentUser && styles.nameHighlight]}>
          {name} {isCurrentUser ? '(You)' : ''}
        </Text>
        <Text style={styles.classText}>Class {userClass} • Level {level}</Text>
      </View>

      {/* XP */}
      <View style={styles.xpWrap}>
        <Text style={[styles.xpNum, isTop3 && styles.xpTop]}>
          {xp.toLocaleString()}
        </Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </View>
  );

  if (isCurrentUser) {
    return (
      <LinearGradient
        colors={['#F0EFFF', '#E8E7FF']}
        style={styles.currentUserWrap}
      >
        {inner}
      </LinearGradient>
    );
  }

  return inner;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 16, backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg, marginBottom: 8, ...SHADOWS.small,
  },
  currentUser: {
    backgroundColor: COLORS.surfaceAlt,
  },
  currentUserWrap: {
    borderRadius: RADIUS.lg, marginBottom: 8,
    borderWidth: 2, borderColor: COLORS.primary, ...SHADOWS.medium,
  },
  top3: { borderWidth: 1, borderColor: COLORS.accentYellow },
  rankWrap: {
    width: 36, alignItems: 'center', marginRight: 10,
  },
  medal: { fontSize: 24 },
  rankNum: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surfaceAlt, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  nameHighlight: { color: COLORS.primary, fontWeight: '700' },
  classText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  xpWrap: { alignItems: 'flex-end' },
  xpNum: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  xpTop: { color: COLORS.primary },
  xpLabel: { fontSize: 10, color: COLORS.textMuted },
});
