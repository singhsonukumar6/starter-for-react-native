/**
 * Test Detail Screen - Shows test details, instructions, and handles test taking flow
 * 
 * Flow:
 * 1. Show test details (syllabus, rewards, timing)
 * 2. If live and not submitted: Show "Start Test" button
 * 3. On Start Test: Show instructions page with "Begin" button
 * 4. On Begin: Navigate to quiz screen
 * 5. After submission: Show "Results will be announced" message
 * 6. If results published: Show results
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../components/Loading';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScreenState = 'details' | 'instructions' | 'quiz' | 'submitted' | 'results';

export default function TestDetailScreen({ initialTestId }: { initialTestId?: string }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const testId = initialTestId || params.id;
  
  const { user: clerkUser } = useUser();
  const [screenState, setScreenState] = useState<ScreenState>('details');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState(0);

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const test = useQuery(
    api.weeklyTests.getTestDetails,
    testId ? { testId: testId as any } : 'skip'
  );

  const testForTaking = useQuery(
    api.weeklyTests.getTestForTaking,
    testId && convexUser ? { testId: testId as any, userId: convexUser._id } : 'skip'
  );

  const userResult = useQuery(
    api.weeklyTests.getTestResult,
    testId && convexUser ? { testId: testId as any, userId: convexUser._id } : 'skip'
  );

  const leaderboard = useQuery(
    api.weeklyTests.getTestLeaderboard,
    testId && test?.isResultsPublished ? { testId: testId as any } : 'skip'
  );

  const submitTest = useMutation(api.weeklyTests.submitTest);

  // Timer effect
  useEffect(() => {
    if (screenState === 'quiz' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screenState, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleStartTest = () => {
    if (!testForTaking || testForTaking.status !== 'available') {
      if (testForTaking?.status === 'submitted') {
        setScreenState('submitted');
      } else if (testForTaking?.status === 'pro_required') {
        Alert.alert('🔒 Pro Required', 'Upgrade to Pro to take this test!', [
          { text: 'Later', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/pro-referral') },
        ]);
      } else {
        Alert.alert('Error', testForTaking?.error || 'Cannot start test');
      }
      return;
    }
    setScreenState('instructions');
  };

  const handleBeginTest = () => {
    if (!testForTaking || testForTaking.status !== 'available' || !('questions' in testForTaking)) return;
    
    setScreenState('quiz');
    setTimeRemaining(testForTaking.duration * 60);
    setTestStartTime(Date.now());
    setAnswers(new Array(testForTaking.questions.length).fill(-1));
    setCurrentQuestion(0);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (testForTaking && testForTaking.status === 'available' && 'questions' in testForTaking && currentQuestion < testForTaking.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (!convexUser || !testId) return;
    
    const unanswered = answers.filter(a => a === -1).length;
    if (unanswered > 0) {
      Alert.alert(
        'Unanswered Questions',
        `You have ${unanswered} unanswered questions. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: () => doSubmit() },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    if (!convexUser) return;
    try {
      const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
      await submitTest({
        userId: convexUser._id,
        testId: testId as any,
        answers,
        timeTaken,
      });
      setScreenState('submitted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit test');
    }
  };

  if (!convexUser || test === undefined) {
    return <Loading message="Loading test..." />;
  }

  const now = Date.now();
  const isLive = test && test.liveAt <= now && test.expiresAt > now;
  const isUpcoming = test && test.liveAt > now;
  const isExpired = test && test.expiresAt <= now;

  // ===== RENDER STATES =====

  // Results Screen
  if (screenState === 'results' || (userResult?.resultsPublished && userResult?.submitted)) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultsHeader}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.resultsTitle}>🎉 Results</Text>
          <Text style={styles.resultsSubtitle}>{test?.title}</Text>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* User Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{userResult?.score}/{userResult?.totalMarks}</Text>
            <Text style={styles.scorePercentage}>{userResult?.percentage}%</Text>
          </View>

          {/* Leaderboard */}
          {leaderboard?.leaderboard && leaderboard.leaderboard.length > 0 && (
            <View style={styles.leaderboardSection}>
              <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
              {leaderboard.leaderboard.slice(0, 10).map((entry: any, idx: number) => (
                <View 
                  key={entry.userId} 
                  style={[
                    styles.leaderboardItem,
                    entry.userId === convexUser._id && styles.leaderboardItemSelf
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </Text>
                  </View>
                  <Text style={styles.leaderboardName}>{entry.userName}</Text>
                  <Text style={styles.leaderboardScore}>{entry.percentage}%</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Submitted Screen
  if (screenState === 'submitted' || (userResult?.submitted && !userResult?.resultsPublished)) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6C63FF', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submittedHeader}
        >
          <Ionicons name="checkmark-circle" size={80} color="rgba(255,255,255,0.9)" />
          <Text style={styles.submittedTitle}>Test Submitted!</Text>
          <Text style={styles.submittedSubtitle}>Your answers have been recorded</Text>
        </LinearGradient>

        <View style={styles.submittedContent}>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#6C63FF" />
            <Text style={styles.infoText}>
              Results will be announced after the test ends. Check back later!
            </Text>
          </View>

          <TouchableOpacity style={styles.backToHomeBtn} onPress={() => router.push('/tests-contests')}>
            <Text style={styles.backToHomeText}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Quiz Screen
  if (screenState === 'quiz' && testForTaking && testForTaking.status === 'available' && 'questions' in testForTaking) {
    const question = testForTaking.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / testForTaking.questions.length) * 100;

    return (
      <View style={styles.container}>
        {/* Quiz Header */}
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => Alert.alert('Exit Test?', 'Your progress will be lost.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', style: 'destructive', onPress: () => router.back() },
          ])}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
          
          <View style={styles.timerBox}>
            <Ionicons name="time-outline" size={16} color={timeRemaining < 60 ? '#EF4444' : '#6C63FF'} />
            <Text style={[styles.timerText, timeRemaining < 60 && { color: '#EF4444' }]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>

          <Text style={styles.questionCounter}>
            {currentQuestion + 1}/{testForTaking.questions.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Question */}
        <ScrollView style={styles.quizContent}>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{question.question}</Text>
            {question.marks && (
              <Text style={styles.marksText}>[{question.marks} marks]</Text>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            {question.options.map((option: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionItem,
                  answers[currentQuestion] === idx && styles.optionItemSelected,
                ]}
                onPress={() => handleSelectAnswer(idx)}
              >
                <View style={[
                  styles.optionRadio,
                  answers[currentQuestion] === idx && styles.optionRadioSelected,
                ]}>
                  {answers[currentQuestion] === idx && (
                    <View style={styles.optionRadioInner} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion] === idx && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.quizFooter}>
          <TouchableOpacity
            style={[styles.navBtn, currentQuestion === 0 && styles.navBtnDisabled]}
            onPress={handlePrevQuestion}
            disabled={currentQuestion === 0}
          >
            <Ionicons name="arrow-back" size={20} color={currentQuestion === 0 ? '#CBD5E1' : '#6C63FF'} />
            <Text style={[styles.navBtnText, currentQuestion === 0 && { color: '#CBD5E1' }]}>Previous</Text>
          </TouchableOpacity>

          {currentQuestion === testForTaking.questions.length - 1 ? (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitTest}>
              <Text style={styles.submitBtnText}>Submit Test</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.navBtn} onPress={handleNextQuestion}>
              <Text style={styles.navBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#6C63FF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Instructions Screen
  if (screenState === 'instructions' && testForTaking && testForTaking.status === 'available' && 'questions' in testForTaking) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#6C63FF', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.instructionsHeader}
        >
          <TouchableOpacity onPress={() => setScreenState('details')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Instructions</Text>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <View style={styles.instructionsCard}>
            <View style={styles.instructionItem}>
              <Ionicons name="time-outline" size={20} color="#6C63FF" />
              <Text style={styles.instructionText}>Time Limit: {testForTaking.duration} minutes</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="help-circle-outline" size={20} color="#6C63FF" />
              <Text style={styles.instructionText}>Total Questions: {testForTaking.questions.length}</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="star-outline" size={20} color="#6C63FF" />
              <Text style={styles.instructionText}>Total Marks: {testForTaking.totalMarks}</Text>
            </View>
          </View>

          {testForTaking.instructions && (
            <View style={styles.instructionsTextCard}>
              <Text style={styles.instructionsText}>{testForTaking.instructions}</Text>
            </View>
          )}

          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={24} color="#F59E0B" />
            <Text style={styles.warningText}>
              Once you start the test, you cannot pause or restart. Make sure you have a stable internet connection.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.beginBtn} onPress={handleBeginTest}>
            <LinearGradient colors={['#6C63FF', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.beginBtnGradient}>
              <Text style={styles.beginBtnText}>Begin Test</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Details Screen (default)
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{test?.title || 'Test Details'}</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Status */}
        <View style={styles.statusRow}>
          {isLive && <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}><Text style={{ color: '#16A34A' }}>🟢 Live Now</Text></View>}
          {isUpcoming && <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}><Text style={{ color: '#2563EB' }}>⏰ Upcoming</Text></View>}
          {isExpired && !test?.isResultsPublished && <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}><Text style={{ color: '#D97706' }}>⏳ Results Pending</Text></View>}
          {test?.isResultsPublished && <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}><Text style={{ color: '#9333EA' }}>🏆 Results Announced</Text></View>}
          {test?.isPaid && <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED' }]}><Text style={{ color: '#EA580C' }}>👑 Pro Only</Text></View>}
        </View>

        <Text style={styles.description}>{test?.description}</Text>

        {/* Schedule */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Goes Live:</Text>
            <Text style={styles.infoValue}>{test ? formatDateTime(test.liveAt) : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expires:</Text>
            <Text style={styles.infoValue}>{test ? formatDateTime(test.expiresAt) : '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{test?.duration} minutes</Text>
          </View>
        </View>

        {/* Syllabus */}
        {test?.syllabus && test.syllabus.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📚 Syllabus</Text>
            {test.syllabus.map((s: string, i: number) => (
              <View key={i} style={styles.syllabusItem}>
                <Text style={styles.syllabusBullet}>•</Text>
                <Text style={styles.syllabusText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rewards */}
        {test?.rewards && test.rewards.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>🎁 Rewards</Text>
            {test.rewards.map((reward: any, idx: number) => (
              <View key={idx} style={styles.rewardItem}>
                <Text style={styles.rewardEmoji}>
                  {reward.rank === 1 ? '🥇' : reward.rank === 2 ? '🥈' : '🥉'}
                </Text>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardPrize}>{reward.prize}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {test?.instructions && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📋 Instructions</Text>
            <Text style={styles.instructionsText}>{test.instructions}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        {isLive && !userResult?.submitted && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleStartTest}>
            <LinearGradient colors={['#6C63FF', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
              <Text style={styles.actionBtnText}>Start Test</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {userResult?.submitted && !userResult?.resultsPublished && (
          <View style={styles.submittedFooter}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.submittedFooterText}>Test Submitted - Results Pending</Text>
          </View>
        )}

        {userResult?.resultsPublished && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setScreenState('results')}>
            <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
              <Text style={styles.actionBtnText}>View Results</Text>
              <Ionicons name="trophy" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isUpcoming && (
          <View style={styles.upcomingFooter}>
            <Text style={styles.upcomingFooterText}>
              Test will be available on {test ? formatDateTime(test.liveAt) : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  syllabusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  syllabusBullet: {
    fontSize: 14,
    color: '#6C63FF',
    marginRight: 8,
  },
  syllabusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rewardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rewardPrize: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  submittedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  submittedFooterText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  upcomingFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  upcomingFooterText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  // Quiz styles
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  },
  questionCounter: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  marksText: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 8,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionItemSelected: {
    borderColor: '#6C63FF',
    backgroundColor: COLORS.surfaceAlt,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioSelected: {
    borderColor: '#6C63FF',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6C63FF',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
  },
  optionTextSelected: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  quizFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6C63FF',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  // Instructions screen
  instructionsHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  instructionsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  instructionsTextCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#3D351F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FBBF24',
  },
  beginBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  beginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  beginBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Submitted screen
  submittedHeader: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  submittedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 20,
  },
  submittedSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  submittedContent: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#2A2F4F',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#A5B4FC',
  },
  backToHomeBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  backToHomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Results screen
  resultsHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: -20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#10B981',
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  leaderboardSection: {
    padding: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  leaderboardItemSelf: {
    backgroundColor: '#1A3D1A',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 12,
  },
  leaderboardScore: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
  },
});
