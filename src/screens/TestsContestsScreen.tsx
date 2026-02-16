/**
 * Tests & Contests Screen - Complete Redesign
 * 
 * TESTS:
 * - Shows all available tests for the user's group
 * - Live tests: "Take Test" button
 * - Upcoming tests: Shows when it will be live
 * - Expired tests: Shows "Results Pending" or "View Results" if announced
 * - Test Detail: Shows syllabus, rewards, timing, instructions
 * - After submission: Shows "Results will be announced after test ends"
 * 
 * CONTESTS:
 * - "Participate" button instead of "Submit Entry"
 * - Shows custom form created by admin
 * - After submission: Shows "Submission Done" with green status
 * - Wait for contest to end for results
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CONTEST_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; gradient: readonly [string, string]; emoji: string; label: string }> = {
  coding: { icon: 'code-slash', color: '#818CF8', bg: '#1E1E3F', gradient: ['#6366F1', '#818CF8'] as const, emoji: '💻', label: 'Coding Challenge' },
  english_speech: { icon: 'mic', color: '#F472B6', bg: '#3D1F2F', gradient: ['#EC4899', '#F472B6'] as const, emoji: '🎤', label: 'English Speaking' },
  english_essay: { icon: 'document-text', color: '#2DD4BF', bg: '#1F3D3A', gradient: ['#14B8A6', '#2DD4BF'] as const, emoji: '✍️', label: 'English Writing' },
  custom: { icon: 'star', color: '#FBBF24', bg: '#3D351F', gradient: ['#F59E0B', '#FBBF24'] as const, emoji: '⭐', label: 'Custom Contest' },
};

export default function TestsContestsScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState<'tests' | 'contests'>('tests');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [participationModal, setParticipationModal] = useState(false);
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Animations
  const tabAnim = useRef(new Animated.Value(0)).current;

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const proStatus = useQuery(
    api.weeklyTests.checkProStatus,
    convexUser ? { userId: convexUser._id } : 'skip'
  );

  const isPro = proStatus?.isPro || false;

  // Tests data - using new API
  const tests = useQuery(
    api.weeklyTests.getAvailableTests,
    convexUser?.group ? { userGroup: convexUser.group, isPro } : 'skip'
  );

  // Contests data - using new API
  const contests = useQuery(
    api.contests.getAvailableContests,
    convexUser?.group ? { userGroup: convexUser.group, isPro } : 'skip'
  );

  // User's test results
  const myResults = useQuery(
    api.weeklyTests.getMyTestResults,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  // User's contest submissions
  const userSubmissions = useQuery(
    api.contests.getUserContestHistory,
    convexUser ? { userId: convexUser._id } : 'skip'
  );

  const submitContestEntry = useMutation(api.contests.submitContestEntry);

  // Tab animation
  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: activeTab === 'tests' ? 0 : 1,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  }, [activeTab]);

  // Helper functions
  const formatCountdown = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Now';
    const days = Math.floor(diff / (86400000));
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const hasSubmittedTest = (testId: string) => {
    return myResults?.some((r: any) => r.testId === testId);
  };

  const hasSubmittedContest = (contestId: string) => {
    return userSubmissions?.some((s: any) => s.contestId === contestId);
  };

  const getTestSubmission = (testId: string) => {
    return myResults?.find((r: any) => r.testId === testId);
  };

  const getContestSubmission = (contestId: string) => {
    return userSubmissions?.find((s: any) => s.contestId === contestId);
  };

  const handleParticipate = () => {
    // Check if selectedItem exists
    if (!selectedItem) {
      console.log('No selected item');
      return;
    }
    
    // Check pro access
    if (selectedItem.isPaid && !isPro) {
      Alert.alert('🔒 Pro Required', 'Upgrade to Pro to participate!', [
        { text: 'Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/pro-referral') },
      ]);
      return;
    }
    
    // Initialize form responses
    const initialResponses: Record<string, string> = {};
    if (selectedItem.formFields && Array.isArray(selectedItem.formFields)) {
      selectedItem.formFields.forEach((field: any) => {
        initialResponses[field.id] = '';
      });
    } else {
      // Initialize default URL field for legacy contests
      initialResponses['url'] = '';
    }
    setFormResponses(initialResponses);
    setParticipationModal(true);
  };

  const handleSubmitParticipation = async () => {
    if (!selectedItem || !convexUser) return;
    
    // Validate required fields
    if (selectedItem.formFields) {
      for (const field of selectedItem.formFields) {
        if (field.required && !formResponses[field.id]?.trim()) {
          Alert.alert('Missing Field', `Please fill in: ${field.label}`);
          return;
        }
      }
    }
    
    setSubmitting(true);
    try {
      // Convert form responses to array format with field labels
      const formResponsesArray = Object.entries(formResponses).map(([fieldId, value]) => {
        const field = selectedItem.formFields?.find((f: any) => f.id === fieldId);
        return {
          fieldId,
          fieldLabel: field?.label || fieldId,
          value,
        };
      });

      await submitContestEntry({
        contestId: selectedItem._id,
        userId: convexUser._id,
        formResponses: formResponsesArray,
      });
      
      Alert.alert('🎉 Submitted!', 'Your participation has been recorded successfully!');
      setParticipationModal(false);
      setDetailModal(false);
      setFormResponses({});
      setSelectedItem(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!convexUser || tests === undefined || contests === undefined) {
    return <Loading message="Loading..." />;
  }

  // ===== RENDER FUNCTIONS =====

  const renderTestCard = (test: any, status: 'upcoming' | 'live' | 'expired') => {
    const submitted = hasSubmittedTest(test._id);
    const now = Date.now();
    const isLive = test.liveAt <= now && test.expiresAt > now;
    const isUpcoming = test.liveAt > now;
    
    return (
      <TouchableOpacity
        key={test._id}
        style={ts.testCard}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedItem(test);
          setDetailModal(true);
        }}
      >
        <LinearGradient
          colors={isLive && !submitted ? ['#6C63FF', '#A855F7'] : ['#F8FAFC', '#F1F5F9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ts.testCardGradient}
        >
          {/* Live indicator */}
          {isLive && !submitted && (
            <View style={ts.liveIndicator}>
              <View style={ts.liveDot} />
              <Text style={ts.liveText}>LIVE</Text>
            </View>
          )}
          
          {test.isPaid && (
            <View style={ts.paidBadge}>
              <Text style={ts.paidBadgeText}>👑 PRO</Text>
            </View>
          )}

          <View style={ts.testCardContent}>
            <View style={ts.testCardLeft}>
              <View style={[ts.testIconCircle, submitted && { backgroundColor: '#D1FAE5' }]}>
                <Text style={ts.testIconEmoji}>
                  {submitted ? '✅' : isUpcoming ? '⏰' : '📝'}
                </Text>
              </View>
              <View style={ts.testCardInfo}>
                <Text style={[ts.testCardTitle, submitted && { color: COLORS.textPrimary }]} numberOfLines={1}>
                  {test.title}
                </Text>
                <Text style={[ts.testCardMeta, submitted && { color: '#64748B' }]}>
                  {test.questions?.length || test.totalQuestions || 0} Qs • {test.duration} min
                </Text>
                
                {isUpcoming && (
                  <View style={ts.countdownRow}>
                    <Ionicons name="time-outline" size={12} color="#6366F1" />
                    <Text style={ts.countdownText}>Starts in {formatCountdown(test.liveAt)}</Text>
                  </View>
                )}
                
                {isLive && !submitted && (
                  <View style={ts.validTillRow}>
                    <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={ts.validTillText}>Ends {formatDateTime(test.expiresAt)}</Text>
                  </View>
                )}
                
                {submitted && (
                  <Text style={ts.submittedText}>✓ Submitted</Text>
                )}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={isLive && !submitted ? "#FFF" : "#94A3B8"} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderContestCard = (contest: any, status: 'upcoming' | 'live' | 'evaluation' | 'completed') => {
    const typeConfig = CONTEST_TYPE_CONFIG[contest.contestType] || CONTEST_TYPE_CONFIG.coding;
    const now = Date.now();
    const isLive = contest.liveAt <= now && contest.expiresAt > now;
    const isUpcoming = contest.liveAt > now;
    const submitted = hasSubmittedContest(contest._id);
    const submission = getContestSubmission(contest._id);

    return (
      <TouchableOpacity
        key={contest._id}
        style={cs.contestCard}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedItem(contest);
          setDetailModal(true);
        }}
      >
        <LinearGradient colors={typeConfig.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cs.contestAccent} />

        <View style={cs.contestBody}>
          <View style={cs.contestHeader}>
            <View style={[cs.contestIconCircle, { backgroundColor: typeConfig.bg }]}>
              <Text style={{ fontSize: 20 }}>{typeConfig.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={cs.contestTitle} numberOfLines={1}>{contest.title}</Text>
              <Text style={cs.contestType}>{typeConfig.label}</Text>
            </View>
            {isLive && !submitted && (
              <View style={cs.contestLiveBadge}>
                <View style={cs.contestLiveDot} />
                <Text style={cs.contestLiveText}>LIVE</Text>
              </View>
            )}
            {submitted && (
              <View style={cs.contestSubmittedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={cs.contestSubmittedText}>Done</Text>
              </View>
            )}
            {contest.isResultsPublished && (
              <View style={cs.contestResultBadge}>
                <Ionicons name="trophy" size={14} color="#F59E0B" />
                <Text style={cs.contestResultText}>Results</Text>
              </View>
            )}
          </View>

          <Text style={cs.contestDesc} numberOfLines={2}>{contest.description}</Text>

          <View style={cs.contestFooter}>
            <View style={cs.contestPointsBadge}>
              <Text style={{ fontSize: 12 }}>⭐</Text>
              <Text style={cs.contestPointsText}>{contest.maxPoints} pts</Text>
            </View>
            {contest.isPaid && (
              <View style={cs.paidBadge}>
                <Text style={cs.paidBadgeText}>👑 PRO</Text>
              </View>
            )}
            {isUpcoming && (
              <Text style={cs.contestDeadline}>
                ⏰ Starts {formatCountdown(contest.liveAt)}
              </Text>
            )}
            {isLive && !submitted && (
              <Text style={cs.contestDeadline}>
                📅 Deadline: {formatDateTime(contest.submissionDeadline)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;
    
    const isTest = activeTab === 'tests';
    const now = Date.now();
    const isLive = selectedItem.liveAt <= now && selectedItem.expiresAt > now;
    const isUpcoming = selectedItem.liveAt > now;
    const isExpired = selectedItem.expiresAt <= now;
    
    const submitted = isTest 
      ? hasSubmittedTest(selectedItem._id)
      : hasSubmittedContest(selectedItem._id);

    return (
      <Modal
        visible={detailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setDetailModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent} 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedItem.title}</Text>
              <Text style={styles.modalDesc}>{selectedItem.description}</Text>
              
              {/* Status Badge */}
              <View style={styles.statusRow}>
                {isLive && <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}><Text style={{ color: '#16A34A' }}>🟢 Live Now</Text></View>}
                {isUpcoming && <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}><Text style={{ color: '#2563EB' }}>⏰ Upcoming</Text></View>}
                {isExpired && !selectedItem.isResultsPublished && <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}><Text style={{ color: '#D97706' }}>⏳ Results Pending</Text></View>}
                {selectedItem.isResultsPublished && <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}><Text style={{ color: '#9333EA' }}>🏆 Results Announced</Text></View>}
                {selectedItem.isPaid && <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED' }]}><Text style={{ color: '#EA580C' }}>👑 Pro Only</Text></View>}
              </View>

              {/* Timing Info */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>📅 Schedule</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Goes Live:</Text>
                  <Text style={styles.infoValue}>{formatDateTime(selectedItem.liveAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expires:</Text>
                  <Text style={styles.infoValue}>{formatDateTime(selectedItem.expiresAt)}</Text>
                </View>
                {!isTest && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Submission Deadline:</Text>
                    <Text style={styles.infoValue}>{formatDateTime(selectedItem.submissionDeadline)}</Text>
                  </View>
                )}
              </View>

              {/* Syllabus for tests */}
              {isTest && selectedItem.syllabus && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>📚 Syllabus</Text>
                  <View style={styles.syllabusList}>
                    {selectedItem.syllabus.map((s: string, i: number) => (
                      <View key={i} style={styles.syllabusItem}>
                        <Text style={styles.syllabusBullet}>•</Text>
                        <Text style={styles.syllabusText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Rewards */}
              {selectedItem.rewards && selectedItem.rewards.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>🎁 Rewards</Text>
                  {selectedItem.rewards.map((reward: any, idx: number) => (
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
              {selectedItem.instructions && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>📋 Instructions</Text>
                  <Text style={styles.instructionsText}>{selectedItem.instructions}</Text>
                </View>
              )}

              {/* Requirements for contests */}
              {!isTest && selectedItem.requirements && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionTitle}>📝 Requirements</Text>
                  <Text style={styles.instructionsText}>{selectedItem.requirements}</Text>
                </View>
              )}

              {/* Already submitted message */}
              {submitted && (
                <View style={styles.submittedBox}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.submittedTitle}>
                    {isTest ? 'Test Submitted!' : 'Entry Submitted!'}
                  </Text>
                  <Text style={styles.submittedDesc}>
                    {selectedItem.isResultsPublished 
                      ? 'Results have been announced!'
                      : 'Results will be available once announced by admin.'}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalFooter}>
              {!submitted && isLive && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    if (selectedItem.isPaid && !isPro) {
                      Alert.alert('🔒 Pro Required', 'Upgrade to Pro to participate!', [
                        { text: 'Later', style: 'cancel' },
                        { text: 'Upgrade', onPress: () => router.push('/pro-referral') },
                      ]);
                      return;
                    }
                    
                    if (isTest) {
                      setDetailModal(false);
                      router.push(`/test/${selectedItem._id}`);
                    } else {
                      // For contests: close detail modal and open participation modal
                      setDetailModal(false);
                      // Use requestAnimationFrame for smoother transition
                      requestAnimationFrame(() => {
                        handleParticipate();
                      });
                    }
                  }}
                >
                  <LinearGradient colors={['#6C63FF', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
                    <Text style={styles.actionBtnText}>
                      {isTest ? 'Take Test' : 'Participate'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {submitted && selectedItem.isResultsPublished && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setDetailModal(false);
                    if (isTest) {
                      router.push(`/test/${selectedItem._id}`);
                    } else {
                      router.push(`/contest/${selectedItem._id}/results`);
                    }
                  }}
                >
                  <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
                    <Text style={styles.actionBtnText}>View Results</Text>
                    <Ionicons name="trophy" size={18} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderParticipationModal = () => {
    if (!selectedItem) return null;
    
    const typeConfig = CONTEST_TYPE_CONFIG[selectedItem.contestType] || CONTEST_TYPE_CONFIG.custom;
    const hasCustomForm = selectedItem.formFields && selectedItem.formFields.length > 0;
    
    const closeModal = () => {
      setParticipationModal(false);
      setFormResponses({});
    };
    
    return (
      <Modal
        visible={participationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={closeModal}
          >
            <TouchableOpacity 
              style={styles.modalContent} 
              activeOpacity={1} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.participationHeader}>
                  <View style={[styles.participationIcon, { backgroundColor: typeConfig.bg }]}>
                    <Text style={{ fontSize: 28 }}>{typeConfig.emoji}</Text>
                  </View>
                  <Text style={styles.modalTitle}>Participate</Text>
                  <Text style={styles.modalDesc}>{selectedItem.title}</Text>
                </View>
                
                {/* Status indicator */}
                <View style={styles.participationStatus}>
                  <View style={styles.statusDotActive} />
                  <Text style={styles.statusText}>Participation Active</Text>
                </View>
                
                {/* Custom Form Fields */}
                {hasCustomForm ? (
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>📝 Fill in your details</Text>
                    {selectedItem.formFields.map((field: any, index: number) => (
                      <View key={field.id} style={styles.formField}>
                        <Text style={styles.fieldLabel}>
                          {field.label}
                          {field.required && <Text style={styles.requiredStar}> *</Text>}
                        </Text>
                        
                        {field.helpText && (
                          <Text style={styles.fieldHelp}>{field.helpText}</Text>
                        )}
                        
                        {field.type === 'textarea' ? (
                          <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={formResponses[field.id] || ''}
                            onChangeText={(text) => setFormResponses(prev => ({ ...prev, [field.id]: text }))}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            multiline
                            numberOfLines={4}
                            maxLength={field.maxLength}
                            textAlignVertical="top"
                          />
                        ) : field.type === 'select' && field.options ? (
                          <View style={styles.selectOptions}>
                            {field.options.map((option: string, optIdx: number) => (
                              <TouchableOpacity
                                key={optIdx}
                                style={[
                                  styles.selectOption,
                                  formResponses[field.id] === option && styles.selectOptionSelected,
                                ]}
                                onPress={() => setFormResponses(prev => ({ ...prev, [field.id]: option }))}
                              >
                                <Text style={[
                                  styles.selectOptionText,
                                  formResponses[field.id] === option && styles.selectOptionTextSelected,
                                ]}>
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ) : (
                          <TextInput
                            style={styles.textInput}
                            value={formResponses[field.id] || ''}
                            onChangeText={(text) => setFormResponses(prev => ({ ...prev, [field.id]: text }))}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            keyboardType={field.type === 'number' ? 'numeric' : field.type === 'url' ? 'url' : 'default'}
                            autoCapitalize={field.type === 'url' ? 'none' : 'sentences'}
                            autoCorrect={field.type !== 'url'}
                            maxLength={field.maxLength}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  /* Default URL submission for legacy contests */
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>📎 Submit your entry</Text>
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionInfoText}>
                        {selectedItem.contestType === 'coding' && '💻 Submit your project URL (GitHub, deployed app, etc.)'}
                        {selectedItem.contestType === 'english_speech' && '🎤 Submit your YouTube video URL'}
                        {selectedItem.contestType === 'english_essay' && '✍️ Submit your PDF URL (Google Drive, etc.)'}
                        {!selectedItem.contestType && 'Submit your entry URL'}
                      </Text>
                    </View>
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Submission URL *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={formResponses['url'] || ''}
                        onChangeText={(text) => setFormResponses(prev => ({ ...prev, ['url']: text }))}
                        placeholder="https://..."
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                      />
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleSubmitParticipation}
                  disabled={submitting}
                >
                  <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
                    {submitting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                        <Text style={styles.actionBtnText}>Submit Participation</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const tabIndicatorX = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 48) / 2],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#6C63FF', '#A855F7', '#C084FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.headerTitle}>Tests & Contests</Text>
            <Text style={styles.headerSub}>Compete, Learn & Win! 🏆</Text>
          </View>
          {isPro ? (
            <View style={styles.proTag}>
              <Text style={{ fontSize: 12 }}>👑</Text>
              <Text style={styles.proTagText}>PRO</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.upgradeTag} onPress={() => router.push('/pro-referral')}>
              <Text style={styles.upgradeTagText}>Go Pro</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <Animated.View style={[
            styles.tabIndicator,
            { transform: [{ translateX: tabIndicatorX }] }
          ]} />
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('tests')} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>Tests</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('contests')} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === 'contests' && styles.tabTextActive]}>Contests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'tests' ? (
          <View style={styles.section}>
            {/* Live Tests */}
            {tests?.live && tests.live.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🔴 Live Now</Text>
                {tests.live.map((test: any) => renderTestCard(test, 'live'))}
              </View>
            )}

            {/* Upcoming Tests */}
            {tests?.upcoming && tests.upcoming.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>⏰ Upcoming</Text>
                {tests.upcoming.map((test: any) => renderTestCard(test, 'upcoming'))}
              </View>
            )}

            {/* Expired Tests */}
            {tests?.expired && tests.expired.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>📋 Past Tests</Text>
                {tests.expired.map((test: any) => renderTestCard(test, 'expired'))}
              </View>
            )}

            {/* Empty State */}
            {(!tests || (tests.live?.length === 0 && tests.upcoming?.length === 0 && tests.expired?.length === 0)) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyTitle}>No Tests Available</Text>
                <Text style={styles.emptyDesc}>Check back later for new tests!</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {/* Live Contests */}
            {contests?.live && contests.live.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🔴 Live Now</Text>
                {contests.live.map((contest: any) => renderContestCard(contest, 'live'))}
              </View>
            )}

            {/* Upcoming Contests */}
            {contests?.upcoming && contests.upcoming.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>⏰ Upcoming</Text>
                {contests.upcoming.map((contest: any) => renderContestCard(contest, 'upcoming'))}
              </View>
            )}

            {/* Evaluation Phase */}
            {contests?.evaluation && contests.evaluation.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>⏳ Under Evaluation</Text>
                {contests.evaluation.map((contest: any) => renderContestCard(contest, 'evaluation'))}
              </View>
            )}

            {/* Completed Contests */}
            {contests?.completed && contests.completed.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>🏆 Completed</Text>
                {contests.completed.map((contest: any) => renderContestCard(contest, 'completed'))}
              </View>
            )}

            {/* Empty State */}
            {(!contests || (contests.live?.length === 0 && contests.upcoming?.length === 0 && contests.completed?.length === 0 && contests.evaluation?.length === 0)) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={styles.emptyTitle}>No Contests Available</Text>
                <Text style={styles.emptyDesc}>Check back later for new contests!</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      {renderDetailModal()}
      {renderParticipationModal()}
    </View>
  );
}

// Styles
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  proTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeTag: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  upgradeTagText: {
    color: '#6C63FF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingTop: 8,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoSectionTitle: {
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
  syllabusList: {
    gap: 8,
  },
  syllabusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  submittedBox: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1A3D1A',
    borderRadius: 16,
    marginTop: 16,
  },
  submittedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ADE80',
    marginTop: 12,
  },
  submittedDesc: {
    fontSize: 14,
    color: '#86EFAC',
    textAlign: 'center',
    marginTop: 4,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 40,
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
  submissionInfo: {
    backgroundColor: '#2A2F4F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  submissionInfoText: {
    fontSize: 14,
    color: '#A5B4FC',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  // Participation modal styles
  participationHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  participationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A2F4F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  participationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3D1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4ADE80',
  },
  formSection: {
    marginTop: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  fieldHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  selectOptionSelected: {
    borderColor: '#6C63FF',
    backgroundColor: COLORS.surfaceAlt,
  },
  selectOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectOptionTextSelected: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

// Test card styles
const ts = StyleSheet.create({
  testCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  testCardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  paidBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EA580C',
  },
  testCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testIconEmoji: {
    fontSize: 22,
  },
  testCardInfo: {
    marginLeft: 14,
    flex: 1,
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  testCardMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  countdownText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  validTillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  validTillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  submittedText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
    marginTop: 4,
  },
});

// Contest card styles
const cs = StyleSheet.create({
  contestCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  contestAccent: {
    height: 4,
  },
  contestBody: {
    padding: 16,
  },
  contestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  contestType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  contestLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  contestLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  contestLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  contestSubmittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  contestSubmittedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  contestResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  contestResultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  contestDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  contestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contestPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  contestPointsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  paidBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EA580C',
  },
  contestDeadline: {
    fontSize: 12,
    color: '#64748B',
  },
});
