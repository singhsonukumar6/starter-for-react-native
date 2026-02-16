/**
 * Challenge Leaderboard Screen
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChallengeLeaderboardScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [period, setPeriod] = useState<'all-time' | 'weekly' | 'monthly'>('all-time');

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const getPeriodString = () => {
    if (period === 'all-time') return 'all-time';
    const now = new Date();
    if (period === 'weekly') {
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = now.getTime() - start.getTime();
      const oneWeek = 604800000;
      const weekNum = Math.ceil(diff / oneWeek);
      return `weekly-${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    } else {
      return `monthly-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }
  };

  const leaderboard = useQuery(api.codingChallenges.getLeaderboard, {
    period: getPeriodString(),
    limit: 50,
  });

  const userRank = useQuery(
    api.codingChallenges.getUserRank,
    convexUser?._id ? { userId: convexUser._id, period: getPeriodString() } : 'skip'
  );

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { backgroundColor: '#FFD70020', borderColor: '#FFD700', textColor: '#FFD700' };
      case 2:
        return { backgroundColor: '#C0C0C020', borderColor: '#C0C0C0', textColor: '#C0C0C0' };
      case 3:
        return { backgroundColor: '#CD7F3220', borderColor: '#CD7F32', textColor: '#CD7F32' };
      default:
        return { backgroundColor: '#252525', borderColor: '#333', textColor: '#888' };
    }
  };

  if (!clerkUser || !convexUser) {
    return <Loading message="Loading leaderboard..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1E1E1E', '#2D2D2D']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          <TouchableOpacity
            style={[styles.periodTab, period === 'all-time' && styles.periodTabActive]}
            onPress={() => setPeriod('all-time')}
          >
            <Text style={[styles.periodTabText, period === 'all-time' && styles.periodTabTextActive]}>
              All Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodTab, period === 'weekly' && styles.periodTabActive]}
            onPress={() => setPeriod('weekly')}
          >
            <Text style={[styles.periodTabText, period === 'weekly' && styles.periodTabTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodTab, period === 'monthly' && styles.periodTabActive]}
            onPress={() => setPeriod('monthly')}
          >
            <Text style={[styles.periodTabText, period === 'monthly' && styles.periodTabTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Top 3 Podium */}
      {leaderboard && leaderboard.length >= 3 && (
        <View style={styles.podium}>
          {/* 2nd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.secondPlace]}>
              {leaderboard[1]?.userImageUrl ? (
                <Image source={{ uri: leaderboard[1].userImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{leaderboard[1]?.userName?.charAt(0)}</Text>
              )}
              <View style={styles.rankBadge}>
                <Ionicons name="medal" size={14} color="#C0C0C0" />
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[1]?.userName}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[1]?.totalPoints}</Text>
            <Text style={styles.podiumLabel}>points</Text>
          </View>

          {/* 1st Place */}
          <View style={[styles.podiumItem, styles.firstPlaceItem]}>
            <View style={[styles.podiumAvatar, styles.firstPlace]}>
              {leaderboard[0]?.userImageUrl ? (
                <Image source={{ uri: leaderboard[0].userImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{leaderboard[0]?.userName?.charAt(0)}</Text>
              )}
              <View style={styles.rankBadge}>
                <Ionicons name="trophy" size={16} color="#FFD700" />
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[0]?.userName}</Text>
            <Text style={[styles.podiumPoints, styles.firstPlacePoints]}>{leaderboard[0]?.totalPoints}</Text>
            <Text style={styles.podiumLabel}>points</Text>
          </View>

          {/* 3rd Place */}
          <View style={styles.podiumItem}>
            <View style={[styles.podiumAvatar, styles.thirdPlace]}>
              {leaderboard[2]?.userImageUrl ? (
                <Image source={{ uri: leaderboard[2].userImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{leaderboard[2]?.userName?.charAt(0)}</Text>
              )}
              <View style={styles.rankBadge}>
                <Ionicons name="medal" size={14} color="#CD7F32" />
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{leaderboard[2]?.userName}</Text>
            <Text style={styles.podiumPoints}>{leaderboard[2]?.totalPoints}</Text>
            <Text style={styles.podiumLabel}>points</Text>
          </View>
        </View>
      )}

      {/* Your Rank Card */}
      {userRank && (
        <View style={styles.yourRankCard}>
          <View style={styles.yourRankLeft}>
            <Text style={styles.yourRankLabel}>Your Rank</Text>
            <Text style={styles.yourRankValue}>#{userRank.rank || '-'}</Text>
          </View>
          <View style={styles.yourRankStats}>
            <View style={styles.yourRankStat}>
              <Text style={styles.yourRankStatValue}>{userRank.totalSolved}</Text>
              <Text style={styles.yourRankStatLabel}>Solved</Text>
            </View>
            <View style={styles.yourRankStat}>
              <Text style={styles.yourRankStatValue}>{userRank.totalPoints}</Text>
              <Text style={styles.yourRankStatLabel}>Points</Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {leaderboard?.map((entry: any, index: number) => {
          const rank = index + 1;
          const style = getRankStyle(rank);
          const isCurrentUser = entry.userId === convexUser._id;

          return (
            <View
              key={entry._id}
              style={[
                styles.rankRow,
                isCurrentUser && styles.currentUserRow,
                { backgroundColor: style.backgroundColor, borderColor: style.borderColor },
              ]}
            >
              <Text style={[styles.rankNumber, { color: style.textColor }]}>
                {rank <= 3 ? '' : `#${rank}`}
              </Text>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  {entry.userImageUrl ? (
                    <Image source={{ uri: entry.userImageUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{entry.userName?.charAt(0)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.userName}>{entry.userName}</Text>
                  <View style={styles.userStats}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.userStatsText}>{entry.totalSolved} solved</Text>
                    <Text style={styles.userStatsDivider}>•</Text>
                    <Text style={styles.userStatsText}>
                      {entry.easySolved}E / {entry.mediumSolved}M / {entry.hardSolved}H
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsValue}>{entry.totalPoints}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>
          );
        })}

        {leaderboard?.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#444" />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Solve challenges to appear on the leaderboard!
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#6366F1',
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  periodTabTextActive: {
    color: '#FFF',
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#141414',
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  firstPlaceItem: {
    marginBottom: 20,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  firstPlace: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  secondPlace: {
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 4,
  },
  podiumPoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
  },
  firstPlacePoints: {
    color: '#FFD700',
  },
  podiumLabel: {
    fontSize: 11,
    color: '#888',
  },
  yourRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  yourRankLeft: {
    alignItems: 'flex-start',
  },
  yourRankLabel: {
    fontSize: 12,
    color: '#888',
  },
  yourRankValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
  },
  yourRankStats: {
    flexDirection: 'row',
    gap: 24,
  },
  yourRankStat: {
    alignItems: 'center',
  },
  yourRankStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  yourRankStatLabel: {
    fontSize: 11,
    color: '#888',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  currentUserRow: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  rankNumber: {
    width: 40,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userStatsText: {
    fontSize: 11,
    color: '#888',
  },
  userStatsDivider: {
    color: '#444',
    marginHorizontal: 4,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
