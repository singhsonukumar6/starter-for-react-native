/**
 * Challenge Solve Screen - Full-screen code editor with test execution
 * Uses Judge0 API for code execution
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Judge0 API Configuration
// Using the free community edition: https://ce.judge0.com/
// For production, consider hosting your own instance or using RapidAPI
const JUDGE0_API_URL = 'https://ce.judge0.com';

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

// Judge0 Language IDs
// See: https://ce.judge0.com/languages/
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71,      // Python 3.8
  javascript: 63,  // JavaScript (Node.js 12.14.0)
  java: 62,        // Java (OpenJDK 13.0.1)
  cpp: 54,         // C++ (GCC 9.2.0)
};

export default function ChallengeSolveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: clerkUser } = useUser();
  const webViewRef = useRef<WebView>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp'>('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'solution' | 'testcases' | 'discussions' | 'submissions'>('description');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'running' | 'accepted' | 'wrong' | 'error'>('idle');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const challenge = useQuery(
    api.codingChallenges.getChallengeById,
    id ? { id: id as any } : 'skip'
  );

  const testCases = useQuery(
    api.codingChallenges.getTestCases,
    id ? { challengeId: id as any } : 'skip'
  );

  const userProgress = useQuery(
    api.codingChallenges.getUserChallengeProgress,
    convexUser && id ? { userId: convexUser._id, challengeId: id as any } : 'skip'
  );

  // Discussions and Submissions
  const discussions = useQuery(
    api.codingChallenges.getDiscussions,
    id ? { challengeId: id as any } : 'skip'
  );

  const publicSubmissions = useQuery(
    api.codingChallenges.getPublicSubmissions,
    id ? { challengeId: id as any, limit: 20 } : 'skip'
  );

  const submitSolution = useMutation(api.codingChallenges.submitSolution);
  const updateResults = useMutation(api.codingChallenges.updateSubmissionResults);
  const createDiscussion = useMutation(api.codingChallenges.createDiscussion);
  const toggleLike = useMutation(api.codingChallenges.toggleDiscussionLike);

  // Initialize code with starter template or user's previous submission
  useEffect(() => {
    // If user has already solved this challenge, load their submission
    if (userProgress?.solved && userProgress?.submission?.code) {
      setCode(userProgress.submission.code);
      setSelectedLanguage(userProgress.submission.language || 'python');
      setSubmissionStatus('accepted');
    } else if (challenge?.starterCode) {
      const starter = challenge.starterCode[selectedLanguage] || '';
      setCode(starter);
    }
  }, [challenge, selectedLanguage, userProgress]);

  // Inject code into WebView
  useEffect(() => {
    if (webViewRef.current && code) {
      webViewRef.current.injectJavaScript(`
        (function() {
          var el = document.getElementById('editor');
          if (el) el.value = ${JSON.stringify(code)};
        })();
        true;
      `);
    }
  }, [code]);

  if (!challenge || !convexUser) {
    return <Loading message="Loading challenge..." />;
  }

  const runCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code first');
      return;
    }

    setIsRunning(true);
    setSubmissionStatus('running');
    setActiveTab('testcases');

    // Get visible test cases for running
    const visibleTestCases = testCases?.filter((tc: any) => !tc.isHidden) || [];

    // Run against test cases
    const results: any[] = [];

    for (const testCase of visibleTestCases.slice(0, 3)) { // Run first 3 visible tests
      try {
        const result = await executeCode(testCase.input);
        const passed = result.output.trim() === testCase.expectedOutput.trim();
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.output,
          passed,
          error: result.error,
        });
      } catch (error: any) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          error: error.message,
        });
      }
    }

    setTestResults(results);
    setShowResults(true);
    setIsRunning(false);

    const allPassed = results.every((r) => r.passed);
    setSubmissionStatus(allPassed ? 'accepted' : 'wrong');
  };

  const submitCode = async () => {
    // Check if already solved
    if (userProgress?.solved) {
      Alert.alert(
        'Already Completed',
        'You have already successfully completed this challenge!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code first');
      return;
    }

    setIsRunning(true);
    setSubmissionStatus('running');
    setActiveTab('testcases');

    try {
      // Create submission
      const submission = await submitSolution({
        userId: convexUser._id,
        challengeId: id as any,
        language: selectedLanguage,
        code,
      });

      // Run all test cases
      const results: any[] = [];
      let totalExecutionTime = 0;

      for (const testCase of submission.testCases) {
        try {
          const startTime = Date.now();
          const result = await executeCode(testCase.input);
          const executionTime = Date.now() - startTime;
          totalExecutionTime += executionTime;

          const passed = result.output.trim() === testCase.expectedOutput.trim();
          results.push({
            testCaseId: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.output,
            passed,
            timeTaken: executionTime,
            error: result.error,
          });
        } catch (error: any) {
          results.push({
            testCaseId: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: '',
            passed: false,
            error: error.message,
          });
        }
      }

      // Update submission with results
      const allPassed = results.every((r) => r.passed);
      const status = allPassed ? 'accepted' : 'wrong_answer';

      await updateResults({
        submissionId: submission.submissionId,
        status,
        testResults: results,
        executionTime: totalExecutionTime,
      });

      setTestResults(results);
      setShowResults(true);
      setSubmissionStatus(allPassed ? 'accepted' : 'wrong');

      if (allPassed) {
        Alert.alert(
          '🎉 Accepted!',
          `Congratulations! You earned ${challenge.points} points!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit solution');
      setSubmissionStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Execute code using Judge0 API
   * Judge0 uses a submission-based approach:
   * 1. Create a submission (POST /submissions)
   * 2. Poll for results (GET /submissions/{token})
   */
  const executeCode = async (input: string): Promise<{ output: string; error?: string }> => {
    const languageId = JUDGE0_LANGUAGE_IDS[selectedLanguage];
    if (!languageId) {
      throw new Error('Language not supported');
    }

    try {
      // Step 1: Create a submission
      const createResponse = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: input,
          cpu_time_limit: 5, // 5 seconds max
          memory_limit: 128000, // 128MB max
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Failed to create submission');
      }

      const submission = await createResponse.json();
      const token = submission.token;

      if (!token) {
        throw new Error('No submission token received');
      }

      // Step 2: Poll for results
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds max wait
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}?base64_encoded=false`);
        
        if (!resultResponse.ok) {
          throw new Error('Failed to get submission result');
        }

        const result = await resultResponse.json();

        // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, etc.
        // See: https://ce.judge0.com/#statuses-and-languages-statuses
        if (result.status && result.status.id >= 3) {
          // Execution completed
          const output = (result.stdout || '').trim();
          const stderr = result.stderr || '';
          const compileOutput = result.compile_output || '';
          
          // Check for errors
          if (result.status.id === 3) {
            // Accepted - execution successful
            return { output, error: undefined };
          } else if (result.status.id === 6) {
            // Compilation Error
            return { output: '', error: compileOutput || 'Compilation error' };
          } else if (result.status.id >= 7 && result.status.id <= 12) {
            // Runtime errors, time limit, memory limit, etc.
            return { output: '', error: stderr || result.status.description || 'Runtime error' };
          } else {
            // Wrong answer or other
            return { output, error: stderr || undefined };
          }
        }

        attempts++;
      }

      throw new Error('Execution timed out');
    } catch (error: any) {
      return { output: '', error: error.message };
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body { 
            margin: 0; padding: 0; 
            height: 100vh; 
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            background-color: #1e1e1e;
            color: #eee;
            overflow: hidden;
          }
          #editor { 
            width: 100%;
            height: 100%;
            border: none; 
            padding: 16px; 
            font-size: 14px; 
            outline: none; 
            resize: none; 
            background: #1e1e1e; 
            color: #dcdcaa;
            line-height: 1.6;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <textarea id="editor" spellcheck="false" placeholder="Write your code here..."></textarea>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.challengeTitle} numberOfLines={1}>
            {challenge.title}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty as keyof typeof DIFFICULTY_COLORS] + '30' },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: DIFFICULTY_COLORS[challenge.difficulty as keyof typeof DIFFICULTY_COLORS] },
              ]}
            >
              {challenge.difficulty.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.pointsText}>{challenge.points}</Text>
        </View>
      </View>

      {/* Already Completed Banner */}
      {userProgress?.solved && (
        <View style={styles.completedBanner}>
          <View style={styles.completedBannerContent}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <View style={styles.completedBannerText}>
              <Text style={styles.completedBannerTitle}>Challenge Completed!</Text>
              <Text style={styles.completedBannerSubtitle}>
                You solved this on {new Date(userProgress.submission?.submittedAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.completedStats}>
            <View style={styles.completedStat}>
              <Text style={styles.completedStatValue}>{userProgress.submission?.language?.toUpperCase() || 'Python'}</Text>
              <Text style={styles.completedStatLabel}>Language</Text>
            </View>
            <View style={styles.completedStat}>
              <Text style={styles.completedStatValue}>{userProgress.submission?.executionTime || 0}ms</Text>
              <Text style={styles.completedStatLabel}>Runtime</Text>
            </View>
            <View style={styles.completedStat}>
              <Text style={styles.completedStatValue}>{challenge.points}</Text>
              <Text style={styles.completedStatLabel}>Points</Text>
            </View>
          </View>
        </View>
      )}

      {/* Language Selector */}
      <View style={styles.languageBar}>
        {(['python', 'javascript', 'java', 'cpp'] as const).map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.langBtn, selectedLanguage === lang && styles.langBtnActive]}
            onPress={() => setSelectedLanguage(lang)}
          >
            <Text style={[styles.langText, selectedLanguage === lang && styles.langTextActive]}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'description' && styles.tabActive]}
          onPress={() => setActiveTab('description')}
        >
          <Text style={[styles.tabText, activeTab === 'description' && styles.tabTextActive]}>
            Description
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'solution' && styles.tabActive]}
          onPress={() => setActiveTab('solution')}
        >
          <Text style={[styles.tabText, activeTab === 'solution' && styles.tabTextActive]}>
            Solution
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'testcases' && styles.tabActive]}
          onPress={() => setActiveTab('testcases')}
        >
          <Text style={[styles.tabText, activeTab === 'testcases' && styles.tabTextActive]}>
            Test Cases
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discussions' && styles.tabActive]}
          onPress={() => setActiveTab('discussions')}
        >
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.tabTextActive]}>
            Discuss
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'submissions' && styles.tabActive]}
          onPress={() => setActiveTab('submissions')}
        >
          <Text style={[styles.tabText, activeTab === 'submissions' && styles.tabTextActive]}>
            Solutions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {activeTab === 'description' && (
          <ScrollView style={styles.descriptionPanel} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Problem</Text>
            <Text style={styles.problemText}>{challenge.problemStatement}</Text>

            <Text style={styles.sectionTitle}>Input Format</Text>
            <Text style={styles.problemText}>{challenge.inputFormat}</Text>

            <Text style={styles.sectionTitle}>Output Format</Text>
            <Text style={styles.problemText}>{challenge.outputFormat}</Text>

            {challenge.constraints && (
              <>
                <Text style={styles.sectionTitle}>Constraints</Text>
                <Text style={styles.problemText}>{challenge.constraints}</Text>
              </>
            )}

            {challenge.examples?.map((example: any, index: number) => (
              <View key={index} style={styles.exampleBox}>
                <Text style={styles.exampleTitle}>Example {index + 1}</Text>
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleLabel}>Input:</Text>
                  <Text style={styles.exampleValue}>{example.input}</Text>
                </View>
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleLabel}>Output:</Text>
                  <Text style={styles.exampleValue}>{example.output}</Text>
                </View>
                {example.explanation && (
                  <Text style={styles.explanation}>{example.explanation}</Text>
                )}
              </View>
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {activeTab === 'solution' && (
          <View style={styles.editorContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent }}
              style={styles.webview}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              onMessage={(event) => {
                setCode(event.nativeEvent.data);
              }}
              injectedJavaScript={`
                (function() {
                  var el = document.getElementById('editor');
                  if (el) {
                    el.value = ${JSON.stringify(code)};
                    el.addEventListener('input', function() {
                      window.ReactNativeWebView.postMessage(el.value);
                    });
                  }
                })();
                true;
              `}
            />
          </View>
        )}

        {activeTab === 'testcases' && (
          <ScrollView style={styles.testCasesPanel} showsVerticalScrollIndicator={false}>
            {showResults ? (
              <View>
                {testResults.map((result, index) => (
                  <View
                    key={index}
                    style={[
                      styles.testResultCard,
                      result.passed ? styles.testPassed : styles.testFailed,
                    ]}
                  >
                    <View style={styles.testResultHeader}>
                      <Text style={styles.testResultTitle}>
                        Test Case {index + 1}
                      </Text>
                      <Ionicons
                        name={result.passed ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={result.passed ? '#10B981' : '#EF4444'}
                      />
                    </View>
                    <View style={styles.testResultContent}>
                      <Text style={styles.testResultLabel}>Input:</Text>
                      <Text style={styles.testResultValue}>{result.input}</Text>
                      <Text style={styles.testResultLabel}>Expected:</Text>
                      <Text style={styles.testResultValue}>{result.expectedOutput}</Text>
                      <Text style={styles.testResultLabel}>Output:</Text>
                      <Text style={[styles.testResultValue, result.passed ? styles.outputPassed : styles.outputFailed]}>
                        {result.actualOutput || result.error}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTests}>
                <Ionicons name="play-circle" size={48} color="#444" />
                <Text style={styles.emptyTestsText}>
                  Run your code to see test results
                </Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <ScrollView style={styles.discussionsPanel} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Discussions</Text>
            
            {/* New Comment Input */}
            <View style={styles.newCommentBox}>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your thoughts or ask a question..."
                placeholderTextColor="#666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={styles.postBtn}
                onPress={async () => {
                  if (!newComment.trim() || !convexUser || !id) return;
                  await createDiscussion({
                    challengeId: id as any,
                    userId: convexUser._id,
                    content: newComment.trim(),
                  });
                  setNewComment('');
                }}
              >
                <Text style={styles.postBtnText}>Post</Text>
              </TouchableOpacity>
            </View>

            {/* Discussion List */}
            {discussions?.map((discussion: any) => (
              <View key={discussion._id} style={styles.discussionItem}>
                <View style={styles.discussionHeader}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarText}>
                      {discussion.userName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={styles.discussionAuthor}>{discussion.userName}</Text>
                  <Text style={styles.discussionTime}>
                    {new Date(discussion.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.discussionContent}>{discussion.content}</Text>
                <View style={styles.discussionActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      if (!convexUser) return;
                      await toggleLike({
                        discussionId: discussion._id,
                        userId: convexUser._id,
                      });
                    }}
                  >
                    <Ionicons name="heart-outline" size={18} color="#888" />
                    <Text style={styles.actionText}>{discussion.likes || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setReplyingTo(replyingTo === discussion._id ? null : discussion._id)}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#888" />
                    <Text style={styles.actionText}>{discussion.replies?.length || 0}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Replies */}
                {discussion.replies?.map((reply: any) => (
                  <View key={reply._id} style={styles.replyItem}>
                    <View style={styles.discussionHeader}>
                      <View style={[styles.avatarSmall, { width: 24, height: 24 }]}>
                        <Text style={[styles.avatarText, { fontSize: 12 }]}>
                          {reply.userName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                      <Text style={styles.discussionAuthor}>{reply.userName}</Text>
                    </View>
                    <Text style={styles.discussionContent}>{reply.content}</Text>
                  </View>
                ))}
                
                {/* Reply Input */}
                {replyingTo === discussion._id && (
                  <View style={styles.replyInputBox}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Write a reply..."
                      placeholderTextColor="#666"
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        if (!newComment.trim() || !convexUser || !id) return;
                        await createDiscussion({
                          challengeId: id as any,
                          userId: convexUser._id,
                          content: newComment.trim(),
                          parentId: discussion._id,
                        });
                        setNewComment('');
                        setReplyingTo(null);
                      }}
                    >
                      <Ionicons name="send" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
            
            {(!discussions || discussions.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#444" />
                <Text style={styles.emptyStateText}>No discussions yet. Be the first to comment!</Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <ScrollView style={styles.submissionsPanel} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Solutions</Text>
            
            {/* Lock message if user hasn't solved */}
            {(!userProgress || !userProgress.solved) && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={48} color="#666" />
                <Text style={styles.lockedTitle}>Solve the challenge first</Text>
                <Text style={styles.lockedText}>
                  You need to solve this challenge before you can view other solutions.
                </Text>
              </View>
            )}
            
            {/* Submissions list (only shown if solved) */}
            {userProgress?.solved && publicSubmissions?.map((submission: any) => (
              <TouchableOpacity key={submission._id} style={styles.submissionItem}>
                <View style={styles.submissionHeader}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarText}>
                      {submission.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionAuthor}>{submission.user?.name || 'Anonymous'}</Text>
                    <Text style={styles.submissionMeta}>
                      {submission.language.toUpperCase()} • {submission.executionTime}ms
                    </Text>
                  </View>
                  <View style={styles.submissionBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.submissionStatus}>Accepted</Text>
                  </View>
                </View>
                <Text style={styles.submissionTime}>
                  {new Date(submission.submittedAt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
            
            {userProgress?.solved && (!publicSubmissions || publicSubmissions.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="code-slash" size={48} color="#444" />
                <Text style={styles.emptyStateText}>No solutions yet. Be the first to solve!</Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        {userProgress?.solved ? (
          <>
            <TouchableOpacity
              style={styles.viewSubmissionBtn}
              onPress={() => setActiveTab('solution')}
            >
              <Ionicons name="eye" size={18} color="#6366F1" />
              <Text style={styles.viewSubmissionBtnText}>View Your Solution</Text>
            </TouchableOpacity>
            <View style={styles.alreadyCompletedBtn}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.alreadyCompletedBtnText}>Completed</Text>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.runBtn}
              onPress={runCode}
              disabled={isRunning}
            >
              {isRunning ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="play" size={18} color="#000" />
                  <Text style={styles.runBtnText}>Run</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={submitCode}
              disabled={isRunning}
            >
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Status Banner */}
      {submissionStatus !== 'idle' && (
        <View
          style={[
            styles.statusBanner,
            submissionStatus === 'accepted' && styles.statusAccepted,
            submissionStatus === 'wrong' && styles.statusWrong,
            submissionStatus === 'error' && styles.statusError,
          ]}
        >
          <Ionicons
            name={
              submissionStatus === 'accepted'
                ? 'checkmark-circle'
                : submissionStatus === 'running'
                ? 'sync'
                : 'alert-circle'
            }
            size={20}
            color="#FFF"
          />
          <Text style={styles.statusText}>
            {submissionStatus === 'accepted'
              ? 'Accepted! All test cases passed!'
              : submissionStatus === 'running'
              ? 'Running tests...'
              : submissionStatus === 'wrong'
              ? 'Wrong Answer. Try again!'
              : 'Error occurred'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  languageBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#252525',
  },
  langBtnActive: {
    backgroundColor: '#6366F1',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  langTextActive: {
    color: '#FFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#FFF',
  },
  mainContent: {
    flex: 1,
  },
  descriptionPanel: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  problemText: {
    fontSize: 14,
    color: '#AAA',
    lineHeight: 22,
  },
  exampleBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  exampleRow: {
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  exampleValue: {
    fontSize: 13,
    color: '#FFF',
    fontFamily: 'monospace',
    backgroundColor: '#252525',
    padding: 8,
    borderRadius: 4,
  },
  explanation: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  testCasesPanel: {
    flex: 1,
    padding: 16,
  },
  testResultCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  testPassed: {
    borderLeftColor: '#10B981',
  },
  testFailed: {
    borderLeftColor: '#EF4444',
  },
  testResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  testResultContent: {
    gap: 4,
  },
  testResultLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 8,
  },
  testResultValue: {
    fontSize: 12,
    color: '#CCC',
    fontFamily: 'monospace',
    backgroundColor: '#252525',
    padding: 8,
    borderRadius: 4,
  },
  outputPassed: {
    color: '#10B981',
  },
  outputFailed: {
    color: '#EF4444',
  },
  emptyTests: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTestsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 12,
  },
  runBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  runBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  submitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  statusBanner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    backgroundColor: '#6366F1',
  },
  statusAccepted: {
    backgroundColor: '#10B981',
  },
  statusWrong: {
    backgroundColor: '#EF4444',
  },
  statusError: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // Discussion styles
  discussionsPanel: {
    flex: 1,
    padding: 16,
  },
  newCommentBox: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  postBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  postBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  discussionItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  discussionAuthor: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  discussionTime: {
    color: '#666',
    fontSize: 11,
    marginLeft: 8,
  },
  discussionContent: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  discussionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#888',
    fontSize: 12,
  },
  actionTextLiked: {
    color: '#EF4444',
  },
  replyItem: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginLeft: 20,
  },
  replyInputBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginLeft: 20,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 6,
    padding: 10,
    color: '#FFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#333',
  },
  // Submissions styles
  submissionsPanel: {
    flex: 1,
    padding: 16,
  },
  lockedOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  lockedIcon: {
    marginBottom: 16,
  },
  lockedTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  lockedText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  lockedHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  submissionItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submissionAuthor: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submissionMeta: {
    color: '#888',
    fontSize: 12,
  },
  submissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  submissionStatus: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  submissionBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  submissionLang: {
    color: '#888',
    fontSize: 12,
  },
  submissionTime: {
    color: '#666',
    fontSize: 11,
  },
  viewCodeBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewCodeText: {
    color: '#FFF',
    fontSize: 12,
  },
  codePreview: {
    marginTop: 12,
    backgroundColor: '#252525',
    borderRadius: 6,
    padding: 12,
  },
  codePreviewText: {
    color: '#CCC',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  // Completed banner styles
  completedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedBannerText: {
    flex: 1,
  },
  completedBannerTitle: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  completedBannerSubtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  completedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  completedStat: {
    alignItems: 'center',
  },
  completedStatValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  completedStatLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  alreadyCompletedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  alreadyCompletedBtnText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  viewSubmissionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  viewSubmissionBtnText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});
