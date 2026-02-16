/**
 * Practice Screen — Quiz after lesson slides with immediate feedback
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { celebration } from '../constants/animations';
import { QuizQuestion } from '../components/QuizQuestion';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();

  const lesson = useQuery(
    api.lessons.getLesson,
    id ? { lessonId: id as Id<'lessons'> } : 'skip'
  );

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const nextLesson = useQuery(
    api.courses.getNextCourseLesson,
    lesson?.courseId && lesson?.order
      ? { courseId: lesson.courseId, currentOrder: lesson.order }
      : 'skip'
  );

  const completeLesson = useMutation(api.lessons.completeLesson);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ selectedIndex: number; correct: boolean }[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQ, setReviewQ] = useState(0);

  if (!lesson || !convexUser) return <Loading message="Loading quiz..." />;

  const questions = lesson.questions || [];
  const totalQ = questions.length;

  const handleAnswer = (selectedIndex: number, isCorrect: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = { selectedIndex, correct: isCorrect };
    setAnswers(newAnswers);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQ < totalQ - 1) {
      setCurrentQ(prev => prev + 1);
      setIsAnswered(answers[currentQ + 1] !== undefined);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowResult(true);
  };

  const handleCompleteLesson = async () => {
    const correctCount = answers.filter((a) => a?.correct).length;
    const score = Math.round((correctCount / totalQ) * 100);

    try {
      await completeLesson({
        userId: convexUser._id,
        lessonId: lesson._id,
        quizScore: score,
        answersCorrect: correctCount,
        answersTotal: totalQ,
      });
      
      if (nextLesson) {
         router.push(`/learn/${nextLesson._id}`);
      } else {
         router.dismissAll();
      }
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  };

  // ── Result Screen ──
  if (showResult && !reviewMode) {
    const correctCount = answers.filter((a) => a?.correct).length;
    const score = Math.round((correctCount / totalQ) * 100);
    const xpEarned = Math.round(lesson.xpReward * (score / 100));
    const isPerfect = score === 100;
    const isGood = score >= 70;
    const wrongAnswers = answers.filter((a) => !a?.correct).length;

    return (
      <View style={styles.resultContainer}>
        <LottieView
          source={celebration}
          autoPlay
          loop={false}
          style={styles.celebLottie}
          resizeMode="cover"
        />

        <View style={styles.resultContent}>
          {/* Modern Result Card */}
          <LinearGradient
            colors={isPerfect ? ['#667eea', '#764ba2'] : isGood ? ['#11998e', '#38ef7d'] : ['#fc4a1a', '#f7b733']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCard}
          >
            <View style={styles.emojiContainer}>
              <Text style={styles.resultEmoji}>
                {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
              </Text>
            </View>
            
            <Text style={styles.resultTitle}>
              {isPerfect ? 'Perfect Score!' : isGood ? 'Great Job!' : 'Keep Going!'}
            </Text>
            
            <Text style={styles.resultSubtitle}>
              {isPerfect 
                ? "You've mastered this lesson!" 
                : isGood 
                  ? "You're doing great, keep it up!" 
                  : "Practice makes perfect."}
            </Text>

            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{score}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statNumber}>{correctCount}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="close-circle" size={24} color="#EF5350" />
              </View>
              <Text style={styles.statNumber}>{wrongAnswers}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="star" size={24} color="#FFB300" />
              </View>
              <Text style={styles.statNumber}>+{xpEarned}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
          </View>

          {/* Review Wrong Answers Button */}
          {wrongAnswers > 0 && (
            <TouchableOpacity 
              style={styles.reviewBtn}
              onPress={() => {
                setReviewMode(true);
                setReviewQ(0);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
              <Text style={styles.reviewBtnText}>Review Wrong Answers</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.resultButtons}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setCurrentQ(0);
              setAnswers([]);
              setShowResult(false);
              setIsAnswered(false);
            }}
          >
            <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleCompleteLesson} 
            activeOpacity={0.8}
            style={styles.doneBtnWrapper}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Review Mode ──
  if (reviewMode) {
    // Find wrong answers to review
    const wrongIndices = answers.map((a, i) => (!a?.correct ? i : -1)).filter(i => i !== -1);
    const currentReviewIndex = wrongIndices[reviewQ];
    const q = questions[currentReviewIndex];
    
    if (!q) {
      setReviewMode(false);
      return null;
    }

    const handleReviewNext = () => {
      if (reviewQ < wrongIndices.length - 1) {
        setReviewQ(prev => prev + 1);
      } else {
        setReviewMode(false);
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setReviewMode(false)} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Answers 📝</Text>
          <Text style={styles.reviewProgress}>{reviewQ + 1}/{wrongIndices.length}</Text>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollInner}
        >
          <QuizQuestion
            key={currentReviewIndex}
            questionNumber={currentReviewIndex + 1}
            totalQuestions={totalQ}
            question={q.question}
            options={q.options || []}
            correctIndex={q.correctIndex ?? 0}
            explanation={q.explanation || ''}
            onAnswer={() => {}}
            preSelectedAnswer={answers[currentReviewIndex]?.selectedIndex}
            isReviewMode={true}
            showFeedback={true}
          />

          <TouchableOpacity 
            onPress={handleReviewNext}
            activeOpacity={0.8}
            style={styles.reviewNextBtn}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>
                {reviewQ < wrongIndices.length - 1 ? 'Next Wrong Answer' : 'Back to Results'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Quiz Screen ──
  const q = questions[currentQ];
  if (!q) return <Loading message="Loading question..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice 🎯</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+{lesson.xpReward} XP</Text>
        </View>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressDots}>
        {questions.map((_: any, i: number) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentQ && styles.dotCurrent,
              answers[i]?.correct && styles.dotCorrect,
              answers[i] && !answers[i].correct && styles.dotWrong,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
      >
        <QuizQuestion
          key={currentQ}
          questionNumber={currentQ + 1}
          totalQuestions={totalQ}
          question={q.question}
          options={q.options || []}
          correctIndex={q.correctIndex ?? 0}
          explanation={q.explanation || ''}
          onAnswer={(idx, isCorrect) => handleAnswer(idx, isCorrect)}
          onNext={handleNext}
          isLastQuestion={currentQ === totalQ - 1}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700',
    color: COLORS.textPrimary,
  },
  xpBadge: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.round,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  xpBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 20, paddingTop: 24 },

  // Progress Dots
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  dotCurrent: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dotCorrect: {
    backgroundColor: COLORS.accentGreen,
  },
  dotWrong: {
    backgroundColor: COLORS.error,
  },

  // Results
  resultContainer: {
    flex: 1, backgroundColor: COLORS.background, justifyContent: 'center',
    alignItems: 'center', padding: 24,
  },
  celebLottie: {
    width: '100%', height: '100%', position: 'absolute', top: 0, left: 0,
    opacity: 0.6,
  },
  resultContent: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  resultCard: {
    width: '100%',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.large,
  },
  emojiContainer: {
    marginBottom: 16,
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  resultEmoji: { fontSize: 56 },
  resultTitle: {
    fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 8,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 24,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.white,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.xl,
    gap: 8,
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  reviewBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  reviewNextBtn: {
    marginTop: 24,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  resultButtons: {
    flexDirection: 'row', gap: 16, width: '100%', alignItems: 'center',
  },
  retryBtn: {
    flex: 1, paddingVertical: 16, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceAlt, alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  retryText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  doneBtnWrapper: { flex: 1.5, ...SHADOWS.medium },
  doneBtn: {
    paddingVertical: 16, borderRadius: RADIUS.xl, alignItems: 'center',
  },
  doneText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
