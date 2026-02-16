/**
 * Learn Screen — Sololearn-style vertical lesson feed
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-expo';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LessonContentBlock } from '../components/LessonContentBlock';
import { EnglishLessonPlayer } from '../components/EnglishLessonPlayer';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LearnScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const scrollRef = useRef<ScrollView>(null);
  
  const isEnglish = type === 'english';
  
  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const completeLessonMutation = useMutation(api.lessons.completeLesson);
  const saveEnglishProgress = useMutation(api.englishLessons.saveEnglishLessonProgress);

  const lesson = useQuery(
    api.lessons.getLesson,
    !isEnglish && id ? { lessonId: id as Id<'lessons'> } : 'skip'
  );

  const englishLesson = useQuery(
    api.englishLessons.getEnglishLesson,
    isEnglish && id ? { lessonId: id as Id<'englishLessons'> } : 'skip'
  );

  const nextLesson = useQuery(
    api.lessons.getNextLessonInSequence,
    !isEnglish && id ? { lessonId: id as Id<'lessons'> } : 'skip'
  );

  // Track the completion status of playground blocks by index
  // Moved above the loading check to avoid "Rendered more hooks" error
  const [blockStatus, setBlockStatus] = useState<Record<number, boolean>>({});

  // English lesson player
  if (isEnglish) {
    if (!englishLesson) return <Loading message="Loading English lesson..." />;
    
    return (
      <EnglishLessonPlayer
        lesson={englishLesson as any}
        onComplete={async (score: number, xpEarned: number) => {
          try {
            await saveEnglishProgress({
              lessonId: id as Id<'englishLessons'>,
              score,
              answersCorrect: Math.round(score / 100 * (englishLesson.questions?.length || 1)),
              answersTotal: englishLesson.questions?.length || 1,
              xpEarned,
            });
          } catch (e) {
            console.error('Failed to save progress:', e);
          }
          router.back();
        }}
        onExit={() => router.back()}
      />
    );
  }

  if (!lesson) return <Loading message="Loading lesson..." />;

  // Support 'content' (new) or 'slides' (legacy fallback)
  // @ts-ignore
  const content = lesson.content || lesson.slides || []; 
  const hasPractice = lesson.questions && lesson.questions.length > 0;

  // New logic: Check if all expected outputs are met
  const requiredBlocks = content.map((b: any, i: number) => ({ ...b, index: i }))
                               .filter((b: any) => b.type === 'playground');
  const isLessonComplete = !requiredBlocks.some((b: any) => !blockStatus[b.index]);

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isLessonComplete) {
      Alert.alert("Task Incomplete", "Please run your code and ensure the output matches the goal!", [
         { text: "OK" }
      ]);
      return;
    }
    
    if (hasPractice) {
      router.push(`/practice/${lesson._id}` as any);
    } else {
      if (!convexUser) return;
      try {
        await completeLessonMutation({
          userId: convexUser._id,
          lessonId: lesson._id,
          quizScore: 100,
          answersCorrect: 0,
          answersTotal: 0,
        });

        // Wait for next lesson query
        if (nextLesson === undefined) {
           // If somehow next lesson query is still loading
           Alert.alert("Loading...", "Please wait while we prepare the next lesson.");
           return;
        }

        if (nextLesson) {
           Alert.alert("Lesson Complete! 🎉", "Taking you to the next lesson...", [
             { 
               text: "Next Lesson →", 
               onPress: () => {
                 // Replace current screen so back button goes to course list not previous lesson
                 router.replace(`/learn/${nextLesson._id}` as any);
               } 
             }
           ]);
        } else {
           Alert.alert("All Lessons Complete! 🏆", "Going back to course page.", [
             {
               text: "Finish",
               onPress: () => {
                 router.replace('/(tabs)/courses');
               }
             }
           ]);
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not save progress.");
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>+{lesson.xpReward} XP</Text>
          </View>
        </View>

        {/* Content Vertical Scroll */}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introBlock}>
              <Text style={styles.lessonDesc}>{lesson.description}</Text>
          </View>

          {content.map((block: any, i: number) => (
              <LessonContentBlock
                key={i}
                block={block}
                blockIndex={i}
                onPlaygroundStatusChange={(isValid) => {
                   setBlockStatus(prev => ({ ...prev, [i]: isValid }));
                }}
              />
          ))}

          <View style={styles.footerSpacing} />
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            onPress={handleFinish} 
            activeOpacity={0.8} 
            style={[styles.fullWidthBtn, !isLessonComplete && { opacity: 0.5 }]}
            disabled={!isLessonComplete}
          >
            <LinearGradient
              colors={isLessonComplete ? COLORS.gradientPrimary : [COLORS.textSecondary, COLORS.textSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextText}>
                {!isLessonComplete ? 'Run Code to Continue 🔨' : (hasPractice ? 'Go to Quiz →' : 'Mark as Complete ✅')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 60,
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  
  xpBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#3D2F1F', borderRadius: 12,
  },
  xpText: { fontSize: 12, fontWeight: '700', color: '#FFB300' },
  
  scrollArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  introBlock: { marginBottom: 24 },
  lessonDesc: { fontSize: 16, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

  footerSpacing: { height: 40 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: 40,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  fullWidthBtn: { width: '100%' },
  nextBtn: {
    paddingVertical: 16, borderRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center',
    // ...SHADOWS.medium, // Temporarily commented out due to syntax error
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  nextText: {
    fontSize: 18, fontWeight: '700', color: COLORS.white,
    letterSpacing: 0.5,
  },
});
