/**
 * Leaderboard Screen — Global / Group / Monthly tabs
 * Monthly leaderboard resets every month. Top 3 win rewards.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

type Tab = 'global' | 'group' | 'monthly';

export default function LeaderboardScreen() {
  const { user: clerkUser } = useUser();
  const [tab, setTab] = useState<Tab>('monthly');

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const globalBoard = useQuery(api.leaderboard.getGlobalLeaderboard);

  const groupBoard = useQuery(
    api.leaderboard.getGroupLeaderboard,
    convexUser?.group ? { group: convexUser.group } : 'skip'
  );

  const monthlyData = useQuery(
    api.leaderboard.getMonthlyLeaderboard,
    convexUser?.group ? { group: convexUser.group } : {}
  );

  const userRank = useQuery(
    api.leaderboard.getUserRank,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  if (!clerkUser) return <Loading message="Loading..." />;

  const board = tab === 'global'
    ? globalBoard
    : tab === 'group'
      ? groupBoard
      : null; // monthly uses its own layout

  const monthlyBoard = monthlyData?.leaderboard || [];
  const monthLabel = monthlyData?.monthLabel || 'This Month';

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🏆</Text>
        <Text style={styles.headerTitle}>Leaderboard</Text>

        {userRank && (
          <View style={styles.myRankCard}>
            <View style={styles.myRankItem}>
              <Text style={styles.myRankValue}>#{userRank.rank}</Text>
              <Text style={styles.myRankLabel}>Your Rank</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.myRankItem}>
              <Text style={styles.myRankValue}>{userRank.xp}</Text>
              <Text style={styles.myRankLabel}>Total XP</Text>
            </View>
            <View style={styles.rankDivider} />
            <View style={styles.myRankItem}>
              <Text style={styles.myRankValue}>Lv.{userRank.level}</Text>
              <Text style={styles.myRankLabel}>Level</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['monthly', 'global', 'group'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'monthly' ? '📅 Monthly' : t === 'global' ? '🌍 Global' : '👥 Group'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {tab === 'monthly' ? (
          <>
            {/* Monthly header info */}
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{monthLabel}</Text>
              <Text style={styles.monthSub}>
                🔄 Resets every month • Top 3 win rewards!
              </Text>
            </View>

            {/* Reward badges */}
            <View style={styles.rewardStrip}>
              <View style={[styles.rewardBadge, { backgroundColor: '#FFF8E1' }]}>
                <Text style={styles.rewardBadgeEmoji}>🥇</Text>
                <Text style={styles.rewardBadgeText}>₹500</Text>
              </View>
              <View style={[styles.rewardBadge, { backgroundColor: '#F3F4F6' }]}>
                <Text style={styles.rewardBadgeEmoji}>🥈</Text>
                <Text style={styles.rewardBadgeText}>₹300</Text>
              </View>
              <View style={[styles.rewardBadge, { backgroundColor: '#FEF3EC' }]}>
                <Text style={styles.rewardBadgeEmoji}>🥉</Text>
                <Text style={styles.rewardBadgeText}>₹200</Text>
              </View>
            </View>

            {monthlyBoard.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏅</Text>
                <Text style={styles.emptyTitle}>No rankings yet this month</Text>
                <Text style={styles.emptyText}>
                  Take weekly tests to appear on the monthly leaderboard!
                </Text>
              </View>
            ) : (
              <>
                {/* Top 3 podium */}
                {monthlyBoard.length >= 3 && (
                  <View style={styles.podium}>
                    <PodiumItem
                      entry={monthlyBoard[1]}
                      medal="🥈"
                      color="#C0C0C0"
                      isCurrentUser={convexUser?._id === monthlyBoard[1].userId}
                    />
                    <PodiumItem
                      entry={monthlyBoard[0]}
                      medal="🥇"
                      color="#FFD700"
                      isCenter
                      isCurrentUser={convexUser?._id === monthlyBoard[0].userId}
                    />
                    <PodiumItem
                      entry={monthlyBoard[2]}
                      medal="🥉"
                      color="#CD7F32"
                      isCurrentUser={convexUser?._id === monthlyBoard[2].userId}
                    />
                  </View>
                )}

                {monthlyBoard.slice(3).map((entry) => (
                  <View key={entry.rank} style={[
                    styles.monthlyRow,
                    convexUser?._id === entry.userId && styles.monthlyRowMe,
                  ]}>
                    <Text style={styles.monthlyRank}>#{entry.rank}</Text>
                    <View style={styles.monthlyAvatar}>
                      <Text style={styles.monthlyInitial}>
                        {entry.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.monthlyName} numberOfLines={1}>
                        {entry.name}
                        {convexUser?._id === entry.userId ? ' (You)' : ''}
                      </Text>
                      <Text style={styles.monthlyMeta}>
                        {entry.testsTaken} tests • Avg {entry.avgPercentage}%
                      </Text>
                    </View>
                    <Text style={styles.monthlyScore}>{entry.totalScore} pts</Text>
                  </View>
                ))}
              </>
            )}
          </>
        ) : !board ? (
          <Loading message="Loading rankings..." fullScreen={false} />
        ) : board.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptyText}>
              Start learning and completing lessons to earn XP!
            </Text>
          </View>
        ) : (
          <>
            {board.length >= 3 && (
              <View style={styles.podium}>
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumAvatar, styles.podium2]}>
                    <Text style={styles.podiumInitial}>
                      {board[1].name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.podiumMedal}>🥈</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{board[1].name}</Text>
                  <Text style={styles.podiumXp}>{board[1].xp} XP</Text>
                </View>

                <View style={[styles.podiumItem, styles.podiumCenter]}>
                  <Text style={styles.crownEmoji}>👑</Text>
                  <View style={[styles.podiumAvatar, styles.podium1]}>
                    <Text style={styles.podiumInitial}>
                      {board[0].name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.podiumMedal}>🥇</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{board[0].name}</Text>
                  <Text style={styles.podiumXp}>{board[0].xp} XP</Text>
                </View>

                <View style={styles.podiumItem}>
                  <View style={[styles.podiumAvatar, styles.podium3]}>
                    <Text style={styles.podiumInitial}>
                      {board[2].name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.podiumMedal}>🥉</Text>
                  <Text style={styles.podiumName} numberOfLines={1}>{board[2].name}</Text>
                  <Text style={styles.podiumXp}>{board[2].xp} XP</Text>
                </View>
              </View>
            )}

            {board.slice(3).map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                rank={entry.rank}
                name={entry.name}
                xp={entry.xp}
                level={entry.level}
                userClass={entry.class}
                isCurrentUser={convexUser?._id === entry.userId}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Podium item for monthly ───
function PodiumItem({ entry, medal, color, isCenter, isCurrentUser }: {
  entry: any; medal: string; color: string; isCenter?: boolean; isCurrentUser?: boolean;
}) {
  return (
    <View style={[styles.podiumItem, isCenter && styles.podiumCenter]}>
      {isCenter && <Text style={styles.crownEmoji}>👑</Text>}
      <View style={[
        styles.podiumAvatar,
        { backgroundColor: color },
        isCenter && { width: 64, height: 64, borderRadius: 32 },
      ]}>
        <Text style={styles.podiumInitial}>
          {entry.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.podiumMedal}>{medal}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.name}{isCurrentUser ? ' (You)' : ''}
      </Text>
      <Text style={styles.podiumXp}>
        {entry.totalScore !== undefined ? `${entry.totalScore} pts` : `${entry.xp} XP`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  myRankCard: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.xl, paddingVertical: 16, paddingHorizontal: 20,
    marginTop: 16, width: '100%',
  },
  myRankItem: { flex: 1, alignItems: 'center' },
  myRankValue: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  myRankLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  rankDivider: {
    width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4,
  },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },

  // Monthly header
  monthHeader: { alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  monthSub: {
    fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500',
  },

  // Reward strip
  rewardStrip: {
    flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center',
  },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: RADIUS.round, gap: 6,
  },
  rewardBadgeEmoji: { fontSize: 18 },
  rewardBadgeText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  // Monthly rows
  monthlyRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg, padding: 14, marginBottom: 8, ...SHADOWS.small,
  },
  monthlyRowMe: {
    borderColor: COLORS.primary, borderWidth: 2,
    backgroundColor: COLORS.surfaceAlt,
  },
  monthlyRank: {
    fontSize: 15, fontWeight: '700', color: COLORS.textSecondary,
    width: 36, textAlign: 'center',
  },
  monthlyAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  monthlyInitial: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  monthlyName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  monthlyMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  monthlyScore: { fontSize: 16, fontWeight: '700', color: COLORS.primary },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 20, maxWidth: 260,
  },

  // Podium
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    marginBottom: 24, paddingHorizontal: 10,
  },
  podiumItem: { flex: 1, alignItems: 'center' },
  podiumCenter: { marginTop: -10 },
  crownEmoji: { fontSize: 24, marginBottom: 4 },
  podiumAvatar: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center',
    alignItems: 'center', marginBottom: 6,
  },
  podium1: { backgroundColor: '#FFD700', width: 64, height: 64, borderRadius: 32 },
  podium2: { backgroundColor: '#C0C0C0' },
  podium3: { backgroundColor: '#CD7F32' },
  podiumInitial: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  podiumMedal: { fontSize: 20 },
  podiumName: {
    fontSize: 13, fontWeight: '600', color: COLORS.textPrimary,
    marginTop: 2, maxWidth: 90, textAlign: 'center',
  },
  podiumXp: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
});
