/**
 * Daily English Screen — Beautiful word learning experience
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { checkSuccess } from '../constants/animations';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export default function DailyEnglishScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentSection, setCurrentSection] = useState(0); // 0=words, 1=structure, 2=quiz

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const today = new Date().toISOString().split('T')[0];
  const dailyContent = useQuery(
    api.daily.getTodayEnglish,
    convexUser?.group ? { group: convexUser.group, date: today } : 'skip'
  );

  const submitCompletion = useMutation(api.daily.submitCompletion);

  const streakInfo = useQuery(
    api.daily.getStreakInfo,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  if (!convexUser) return <Loading message="Loading your content..." />;

  if (!dailyContent) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={COLORS.gradientPrimary} style={styles.emptyHeader}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>Daily English</Text>
        </LinearGradient>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyIcon}>🍋</Text>
          <Text style={styles.emptyText}>Today's lesson is loading!</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh or check your internet connection.</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="ghost"
            style={{ marginTop: 20 }}
          />
        </View>
      </View>
    );
  }

  const words = [
    { word: dailyContent.word1, synonym: dailyContent.synonym1, antonym: dailyContent.antonym1, sentence: dailyContent.sentence1 },
    { word: dailyContent.word2, synonym: dailyContent.synonym2, antonym: dailyContent.antonym2, sentence: dailyContent.sentence2 },
    { word: dailyContent.word3, synonym: dailyContent.synonym3, antonym: dailyContent.antonym3, sentence: dailyContent.sentence3 },
  ];

  const handleComplete = async () => {
    try {
      await submitCompletion({ userId: convexUser._id, date: today });
      const streak = (streakInfo?.currentStreak || 0) + 1;
      router.push(`/streak-success?day=${streak}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save progress');
    }
  };

  const handleQuizAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const sections = ['Words', 'Grammar', 'Quiz'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily English 📚</Text>
        <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </LinearGradient>

      {/* Section Tabs */}
      <View style={styles.tabs}>
        {sections.map((sec, idx) => (
          <TouchableOpacity
            key={sec}
            onPress={() => setCurrentSection(idx)}
            style={[styles.tab, currentSection === idx && styles.tabActive]}
          >
            <Text style={[styles.tabText, currentSection === idx && styles.tabTextActive]}>
              {sec}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Section 0: Words */}
        {currentSection === 0 && (
          <View>
            <Text style={styles.sectionTitle}>Today's Words ✨</Text>
            {words.map((w, i) => (
              <Card key={i} variant="elevated" style={styles.wordCard}>
                <View style={styles.wordHeader}>
                  <View style={styles.wordNumBadge}>
                    <Text style={styles.wordNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.wordTitle}>{w.word}</Text>
                </View>
                <View style={styles.wordMeta}>
                  <View style={[styles.pill, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.pillText, { color: '#2E7D32' }]}>
                      ≈ {w.synonym}
                    </Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.pillText, { color: '#C62828' }]}>
                      ≠ {w.antonym}
                    </Text>
                  </View>
                </View>
                <View style={styles.sentenceBox}>
                  <Text style={styles.sentenceLabel}>Example:</Text>
                  <Text style={styles.sentence}>"{w.sentence}"</Text>
                </View>
              </Card>
            ))}
            <Button
              title="Next: Grammar →"
              onPress={() => setCurrentSection(1)}
              fullWidth
              variant="ghost"
            />
          </View>
        )}

        {/* Section 1: Structure */}
        {currentSection === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Grammar Focus 🧠</Text>
            <Card variant="elevated">
              <LinearGradient
                colors={COLORS.gradientCool}
                style={styles.structureHeader}
              >
                <Text style={styles.structureTitle}>{dailyContent.structureTitle}</Text>
              </LinearGradient>
              <View style={styles.ruleBox}>
                <Text style={styles.ruleLabel}>📏 Rule:</Text>
                <Text style={styles.ruleText}>{dailyContent.structureRule}</Text>
              </View>
              <View style={styles.examplesBox}>
                <Text style={styles.examplesLabel}>📝 Examples:</Text>
                <Text style={styles.examplesText}>{dailyContent.structureExamples}</Text>
              </View>
            </Card>
            <Button
              title="Next: Quiz Time! →"
              onPress={() => setCurrentSection(2)}
              fullWidth
              variant="ghost"
            />
          </View>
        )}

        {/* Section 2: Quiz */}
        {currentSection === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Quiz Time! 🎯</Text>
            <Card variant="elevated">
              <Text style={styles.quizQuestion}>{dailyContent.practiceQuestion}</Text>

              {showResult && selectedAnswer === dailyContent.correctAnswer && (
                <View style={styles.resultBox}>
                  <LottieView source={checkSuccess} autoPlay loop={false} style={styles.checkLottie} />
                  <Text style={styles.resultCorrect}>Correct! Amazing! 🎉</Text>
                </View>
              )}

              {showResult && selectedAnswer !== dailyContent.correctAnswer && (
                <View style={styles.resultBox}>
                  <Text style={styles.resultWrong}>Not quite! The answer is:</Text>
                  <Text style={styles.correctAnswer}>{dailyContent.correctAnswer}</Text>
                </View>
              )}

              {!showResult && (
                <View style={styles.quizInput}>
                  <TouchableOpacity
                    style={styles.answerBtn}
                    onPress={() => handleQuizAnswer(dailyContent.correctAnswer)}
                  >
                    <Text style={styles.answerBtnText}>Show Answer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {showResult && (
              <Button
                title="Complete Today's Lesson! 🏆"
                onPress={handleComplete}
                fullWidth
                size="large"
                gradient={COLORS.gradientSuccess}
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  headerDate: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 16, gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  body: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  wordCard: { marginBottom: 16 },
  wordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  wordNumBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  wordNum: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  wordTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  wordMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.round },
  pillText: { fontSize: 13, fontWeight: '600' },
  sentenceBox: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 12 },
  sentenceLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
  sentence: { fontSize: 14, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  structureHeader: { borderRadius: RADIUS.md, padding: 16, marginBottom: 16 },
  structureTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  ruleBox: { marginBottom: 16 },
  ruleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  ruleText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  examplesBox: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 12 },
  examplesLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  examplesText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  quizQuestion: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 26, marginBottom: 20 },
  quizInput: { marginTop: 8 },
  answerBtn: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center',
  },
  answerBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  resultBox: { alignItems: 'center', paddingVertical: 16 },
  checkLottie: { width: 80, height: 80 },
  resultCorrect: { fontSize: 20, fontWeight: '700', color: COLORS.success, marginTop: 8 },
  resultWrong: { fontSize: 16, color: COLORS.error, marginBottom: 8 },
  correctAnswer: { fontSize: 20, fontWeight: '700', color: COLORS.success },
  // Empty state
  emptyContainer: { flex: 1, backgroundColor: COLORS.background },
  emptyHeader: {
    paddingTop: 60, paddingBottom: 30, alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});
