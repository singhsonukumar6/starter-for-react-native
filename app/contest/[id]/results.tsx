/**
 * Contest Results Route - Shows contest results after they are announced
 */
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../../../src/components/Loading';

export default function ContestResultsRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: clerkUser } = useUser();

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const results = useQuery(
    api.contests.getContestResults,
    id ? { contestId: id as any } : 'skip'
  );

  if (!convexUser || results === undefined) {
    return <Loading message="Loading results..." />;
  }

  if (!results) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6C63FF', '#A855F7']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Results Not Available</Text>
        </LinearGradient>
        <View style={styles.content}>
          <Text style={styles.emptyText}>Results have not been announced yet.</Text>
        </View>
      </View>
    );
  }

  const { contest, winners, rankings } = results;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Results</Text>
        <Text style={styles.headerSubtitle}>{contest.title}</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Winners */}
        {winners && winners.length > 0 && (
          <View style={styles.winnersSection}>
            <Text style={styles.sectionTitle}>🎉 Winners</Text>
            {winners.map((winner: any, idx: number) => (
              <View key={winner.userId} style={styles.winnerCard}>
                <View style={styles.winnerRank}>
                  <Text style={styles.winnerEmoji}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </Text>
                </View>
                <View style={styles.winnerInfo}>
                  <Text style={styles.winnerName}>{winner.userName}</Text>
                  <Text style={styles.winnerMarks}>{winner.marks} points</Text>
                </View>
                {contest.rewards?.[idx] && (
                  <View style={styles.winnerPrize}>
                    <Text style={styles.prizeText}>{contest.rewards[idx].prize}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Full Rankings */}
        {rankings && rankings.length > 0 && (
          <View style={styles.rankingsSection}>
            <Text style={styles.sectionTitle}>📊 Full Rankings</Text>
            {rankings.map((entry: any, idx: number) => (
              <View 
                key={entry.userId} 
                style={[
                  styles.rankingItem,
                  entry.userId === convexUser._id && styles.rankingItemSelf
                ]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </Text>
                </View>
                <Text style={styles.rankingName}>{entry.userName}</Text>
                <Text style={styles.rankingMarks}>{entry.marks} pts</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  winnersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  winnerRank: {
    width: 50,
    alignItems: 'center',
  },
  winnerEmoji: {
    fontSize: 32,
  },
  winnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  winnerMarks: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  winnerPrize: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  prizeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
  },
  rankingsSection: {
    marginTop: 8,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rankingItemSelf: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
  },
  rankingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 12,
  },
  rankingMarks: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
});
