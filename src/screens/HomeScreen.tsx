/**
 * Home Dashboard Screen — Gamified learning hub
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StreakDisplay } from '../components/StreakDisplay';
import { WinnerSlider } from '../components/WinnerSlider';
import { Card } from '../components/Card';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS, ACTION_CARD_COLORS } from '../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const streakInfo = useQuery(
    api.daily.getStreakInfo,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const courses = useQuery(api.courses.getCourses);

  const today = new Date().toISOString().split('T')[0];
  const dailyContent = useQuery(
    api.daily.getTodayEnglish,
    convexUser?.group ? { group: convexUser.group, date: today } : 'skip'
  );

  // New: Winners slider
  const winners = useQuery(api.leaderboard.getWinners);

  // New: Word & Sentence of the day
  const wordOfDay = useQuery(
    api.wordOfDay.getWordOfTheDay,
    convexUser?.group ? { group: convexUser.group, date: today } : 'skip'
  );
  const sentenceOfDay = useQuery(
    api.wordOfDay.getSentenceOfTheDay,
    convexUser?.group ? { group: convexUser.group, date: today } : 'skip'
  );

  // New: Continue learning — next lesson
  const nextLesson = useQuery(
    api.lessons.getNextLesson,
    convexUser?._id && convexUser?.group
      ? { userId: convexUser._id, category: 'english', group: convexUser.group }
      : 'skip'
  );

  // New: Weekly test
  const activeTest = useQuery(
    api.weeklyTests.getActiveTest,
    convexUser?.group ? { group: convexUser.group } : 'skip'
  );

  // New: User rank
  const userRank = useQuery(
    api.leaderboard.getUserRank,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (!clerkUser) return <Loading message="Loading..." />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>
              {convexUser?.name || clerkUser.firstName || 'Student'}
            </Text>
            {convexUser && (
              <View style={styles.headerMeta}>
                <View style={styles.classBadge}>
                  <Text style={styles.classText}>Class {convexUser.class}</Text>
                </View>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpText}>⭐ {convexUser.xp || 0} XP</Text>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv.{convexUser.level || 1}</Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.avatar}>
              {(convexUser?.name || clerkUser.firstName || 'S').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Streak */}
        <StreakDisplay
          currentDay={streakInfo?.currentStreak || 0}
          totalDays={100}
        />

        {/* Winners Slider */}
        {winners && winners.length > 0 && (
          <WinnerSlider winners={winners} />
        )}

        {/* Continue Learning */}
        {nextLesson && (
          <>
            <Text style={styles.sectionTitle}>Continue Learning 📚</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/learn/${nextLesson._id}`)}
            >
              <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueCard}
              >
                <View style={styles.continueInfo}>
                  <Text style={styles.continueLabel}>Next Lesson</Text>
                  <Text style={styles.continueTitle}>{nextLesson.title}</Text>
                  <Text style={styles.continueSub}>
                    {nextLesson.content?.length || 0} reading • {nextLesson.questions?.length || 0} quiz questions
                  </Text>
                </View>
                <View style={styles.continueAction}>
                  <Text style={styles.continueXp}>+{nextLesson.xpReward} XP</Text>
                  <Text style={styles.continueArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Word of the Day Preview */}
        {wordOfDay && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/word-of-day')}
          >
            <View style={[styles.wordCard, SHADOWS.medium]}>
              <View style={styles.wordHeader}>
                <Text style={styles.wordBadge}>📖 WORD OF THE DAY</Text>
                <Text style={styles.wordSeeMore}>See more →</Text>
              </View>
              <Text style={styles.wordMain}>{wordOfDay.word}</Text>
              <Text style={styles.wordPos}>{wordOfDay.partOfSpeech}</Text>
              <Text style={styles.wordMeaning} numberOfLines={2}>
                {wordOfDay.meaning}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Sentence Structure Preview */}
        {sentenceOfDay && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/word-of-day')}
          >
            <View style={[styles.sentenceCard, SHADOWS.medium]}>
              <Text style={styles.sentenceBadge}>✍️ SENTENCE STRUCTURE</Text>
              <Text style={styles.sentenceName}>{sentenceOfDay.structureName}</Text>
              <View style={styles.formulaPill}>
                <Text style={styles.formulaText}>{sentenceOfDay.formula}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions ⚡</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: ACTION_CARD_COLORS.daily }]}
            onPress={() => router.push('/daily/today')}
          >
            <Text style={styles.actionEmoji}>📚</Text>
            <Text style={styles.actionLabel}>Daily{'\n'}English</Text>
            <View style={[styles.actionBadge, dailyContent ? {} : { backgroundColor: COLORS.accentOrange }]}>
              <Text style={styles.actionBadgeText}>{dailyContent ? 'Ready!' : 'Open'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: ACTION_CARD_COLORS.tests }]}
            onPress={() => router.push('/tests-contests')}
          >
            <Text style={styles.actionEmoji}>📝</Text>
            <Text style={styles.actionLabel}>Tests{'\n'}& Quizzes</Text>
            <View style={[styles.actionBadge, activeTest ? { backgroundColor: COLORS.accentOrange } : {}]}>
              <Text style={styles.actionBadgeText}>{activeTest ? 'Active!' : 'Open'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: ACTION_CARD_COLORS.challenges }]}
            onPress={() => router.push('/challenges')}
          >
            <Text style={styles.actionEmoji}>💻</Text>
            <Text style={styles.actionLabel}>Coding{'\n'}Challenges</Text>
            <View style={[styles.actionBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.actionBadgeText}>Solve</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: ACTION_CARD_COLORS.contest }]}
            onPress={() => router.push('/tests-contests')}
          >
            <Text style={styles.actionEmoji}>🏆</Text>
            <Text style={styles.actionLabel}>Contests{'\n'}& Prizes</Text>
            <View style={[styles.actionBadge, { backgroundColor: '#E91E63' }]}>
              <Text style={styles.actionBadgeText}>Compete</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: ACTION_CARD_COLORS.leaderboard }]}
            onPress={() => router.push('/(tabs)/leaderboard')}
          >
            <Text style={styles.actionEmoji}>🏅</Text>
            <Text style={styles.actionLabel}>Leader{'\n'}board</Text>
            {userRank && (
              <View style={[styles.actionBadge, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.actionBadgeText}>#{userRank.rank}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Your Stats 📊</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNum}>{streakInfo?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNum}>{convexUser?.xp || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statNum}>#{userRank?.rank || '—'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </Card>
        </View>

        {/* Leaderboard Preview */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/leaderboard')}
        >
          <Card style={styles.leaderboardPreview} variant="elevated">
            <View style={styles.lbPreviewHeader}>
              <Text style={styles.lbPreviewTitle}>🏅 Top Learners</Text>
              <Text style={styles.lbSeeAll}>See All →</Text>
            </View>
            <Text style={styles.lbPreviewSub}>
              Keep learning to climb the leaderboard and win prizes!
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Motivational quote */}
        <Card style={styles.quoteCard} variant="elevated">
          <Text style={styles.quoteEmoji}>💡</Text>
          <Text style={styles.quoteText}>
            "The more that you read, the more things you will know. The more that you learn, the more places you'll go."
          </Text>
          <Text style={styles.quoteAuthor}>— Dr. Seuss</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 28, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
  headerMeta: { flexDirection: 'row', gap: 6, marginTop: 8 },
  classBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.round,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  classText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  xpBadge: {
    backgroundColor: 'rgba(255,215,0,0.3)', borderRadius: RADIUS.round,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  xpText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.round,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  levelText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatar: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  content: { padding: 20, paddingTop: 24 },
  sectionTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14, marginTop: 8,
  },

  // Continue Learning
  continueCard: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    borderRadius: RADIUS.xl, marginBottom: 20, ...SHADOWS.medium,
  },
  continueInfo: { flex: 1 },
  continueLabel: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1, marginBottom: 4,
  },
  continueTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, lineHeight: 24 },
  continueSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  continueAction: { alignItems: 'flex-end', marginLeft: 12 },
  continueXp: {
    fontSize: 14, fontWeight: '700', color: COLORS.white,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.round,
    paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden',
  },
  continueArrow: { fontSize: 24, color: COLORS.white, marginTop: 6 },

  // Word of Day
  wordCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: 18, marginBottom: 14,
  },
  wordHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  wordBadge: { fontSize: 11, fontWeight: '700', color: COLORS.primaryLight },
  wordSeeMore: { fontSize: 12, color: COLORS.textLink, fontWeight: '600' },
  wordMain: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary },
  wordPos: {
    fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: 6,
  },
  wordMeaning: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Sentence Structure
  sentenceCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: 18, marginBottom: 20,
  },
  sentenceBadge: { fontSize: 11, fontWeight: '700', color: COLORS.accentOrange, marginBottom: 6 },
  sentenceName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  formulaPill: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md,
    padding: 10,
  },
  formulaText: {
    fontSize: 14, fontWeight: '600', color: COLORS.primaryLight, fontFamily: 'monospace',
  },

  // Action grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: '48%', borderRadius: RADIUS.xl, padding: 14, alignItems: 'center',
    minHeight: 110, justifyContent: 'center', ...SHADOWS.small,
  },
  actionEmoji: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  actionBadge: {
    backgroundColor: COLORS.accentGreen, borderRadius: RADIUS.round,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 5,
  },
  actionBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', padding: 14, backgroundColor: COLORS.cardBg },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  // Leaderboard preview
  leaderboardPreview: { marginBottom: 20, backgroundColor: COLORS.cardBg },
  lbPreviewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  lbPreviewTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  lbSeeAll: { fontSize: 13, color: COLORS.textLink, fontWeight: '600' },
  lbPreviewSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },

  // Quote
  quoteCard: { backgroundColor: COLORS.cardBg, marginBottom: 30 },
  quoteEmoji: { fontSize: 28, marginBottom: 8 },
  quoteText: {
    fontSize: 15, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 22,
  },
  quoteAuthor: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, textAlign: 'right' },
});
