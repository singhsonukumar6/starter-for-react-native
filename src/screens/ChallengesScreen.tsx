/**
 * Coding Challenges Screen - LeetCode-style challenge list
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export default function ChallengesScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const categories = useQuery(api.codingChallenges.getCategories);
  const challenges = useQuery(api.codingChallenges.getChallenges, {
    categoryId: selectedCategory ? (selectedCategory as any) : undefined,
    difficulty: selectedDifficulty || undefined,
    searchQuery: searchQuery || undefined,
    group: convexUser?.group || undefined, // Filter by user's group
  });

  const userProgress = useQuery(
    api.codingChallenges.getUserProgress,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const userStats = useQuery(
    api.codingChallenges.getUserStats,
    convexUser?._id ? { userId: convexUser._id, group: convexUser.group } : 'skip'
  );

  // Get solved challenge IDs
  const solvedIds = new Set(
    userProgress?.filter((p: any) => p.solved).map((p: any) => p.challengeId) || []
  );

  const filteredChallenges = challenges?.filter((challenge: any) => {
    if (selectedDifficulty && challenge.difficulty !== selectedDifficulty) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        challenge.title.toLowerCase().includes(query) ||
        challenge.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (!clerkUser || !convexUser) {
    return <Loading message="Loading challenges..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E1E1E', '#2D2D2D']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Coding Challenges</Text>
          <TouchableOpacity onPress={() => router.push('/challenge-leaderboard')}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        {userStats && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalSolved}</Text>
              <Text style={styles.statLabel}>Solved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{userStats.rank || '-'}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>
        )}

        {/* Progress Bar */}
        {userStats && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(userStats.easySolved / Math.max(userStats.easyTotal, 1)) * 100}%`, backgroundColor: DIFFICULTY_COLORS.easy }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Easy: {userStats.easySolved}/{userStats.easyTotal}</Text>
              <Text style={styles.progressLabel}>Medium: {userStats.mediumSolved}/{userStats.mediumTotal}</Text>
              <Text style={styles.progressLabel}>Hard: {userStats.hardSolved}/{userStats.hardTotal}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Search & Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search challenges..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Difficulty Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedDifficulty && styles.filterChipActive,
            ]}
            onPress={() => setSelectedDifficulty(null)}
          >
            <Text style={[styles.filterChipText, !selectedDifficulty && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedDifficulty === 'easy' && styles.filterChipEasy,
            ]}
            onPress={() => setSelectedDifficulty('easy')}
          >
            <Text style={[styles.filterChipText, selectedDifficulty === 'easy' && styles.filterChipTextActive]}>
              Easy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedDifficulty === 'medium' && styles.filterChipMedium,
            ]}
            onPress={() => setSelectedDifficulty('medium')}
          >
            <Text style={[styles.filterChipText, selectedDifficulty === 'medium' && styles.filterChipTextActive]}>
              Medium
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedDifficulty === 'hard' && styles.filterChipHard,
            ]}
            onPress={() => setSelectedDifficulty('hard')}
          >
            <Text style={[styles.filterChipText, selectedDifficulty === 'hard' && styles.filterChipTextActive]}>
              Hard
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Filters */}
        {categories && categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
                All Topics
              </Text>
            </TouchableOpacity>
            {categories.map((cat: any) => (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat._id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat._id)}
              >
                {cat.icon && <Text style={styles.categoryIcon}>{cat.icon}</Text>}
                <Text style={[styles.categoryChipText, selectedCategory === cat._id && styles.categoryChipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Challenges List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredChallenges?.map((challenge: any) => (
          <TouchableOpacity
            key={challenge._id}
            style={styles.challengeCard}
            onPress={() => router.push(`/challenge/${challenge._id}`)}
          >
            <View style={styles.challengeMain}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeTitleRow}>
                  {solvedIds.has(challenge._id) && (
                    <Ionicons name="checkmark-circle" size={18} color={DIFFICULTY_COLORS.easy} />
                  )}
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty as keyof typeof DIFFICULTY_COLORS] + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      { color: DIFFICULTY_COLORS[challenge.difficulty as keyof typeof DIFFICULTY_COLORS] },
                    ]}
                  >
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.challengeDesc} numberOfLines={2}>
                {challenge.description || challenge.problemStatement}
              </Text>

              <View style={styles.challengeFooter}>
                <View style={styles.challengeMeta}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.metaText}>{challenge.points} pts</Text>
                </View>
                {challenge.acceptanceRate && (
                  <View style={styles.challengeMeta}>
                    <Ionicons name="stats-chart" size={14} color="#888" />
                    <Text style={styles.metaText}>{challenge.acceptanceRate.toFixed(1)}%</Text>
                  </View>
                )}
                {challenge.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{challenge.category.name}</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}

        {filteredChallenges?.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="code-slash" size={48} color="#444" />
            <Text style={styles.emptyTitle}>No challenges found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or search query
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
    paddingBottom: 20,
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressSection: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: '#888',
  },
  filtersSection: {
    padding: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#FFF',
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  filterChipEasy: {
    backgroundColor: DIFFICULTY_COLORS.easy + '30',
    borderWidth: 1,
    borderColor: DIFFICULTY_COLORS.easy,
  },
  filterChipMedium: {
    backgroundColor: DIFFICULTY_COLORS.medium + '30',
    borderWidth: 1,
    borderColor: DIFFICULTY_COLORS.medium,
  },
  filterChipHard: {
    backgroundColor: DIFFICULTY_COLORS.hard + '30',
    borderWidth: 1,
    borderColor: DIFFICULTY_COLORS.hard,
  },
  filterChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  categoryScroll: {
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1E1E',
    marginRight: 8,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  categoryIcon: {
    fontSize: 12,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#252525',
  },
  challengeMain: {
    flex: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  challengeDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  categoryBadge: {
    backgroundColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
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
  },
});
