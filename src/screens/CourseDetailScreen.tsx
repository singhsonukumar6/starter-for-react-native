/**
 * Course Detail Screen — Full course overview with lessons & progress
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SectionList, SectionListRenderItem,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../components/Loading';
import { Card } from '../components/Card';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import type { Id } from '../../convex/_generated/dataModel';

const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#4CAF50',
  Intermediate: '#FF9800',
  Advanced: '#E91E63',
};

const categoryGradients: Record<string, readonly [string, string, ...string[]]> = {
  english: COLORS.gradientPrimary,
  abacus: COLORS.gradientWarm,
  vedic: COLORS.gradientSunset,
  coding: COLORS.gradientCool,
  ai: ['#A855F7', '#EC4899'] as const,
};

const categoryEmojis: Record<string, string> = {
  english: '📚', abacus: '🧮', vedic: '🔢', coding: '💻', ai: '🤖',
};

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: clerkUser } = useUser();

  const course = useQuery(
    api.courses.getCourse,
    id ? { courseId: id as Id<'courses'> } : 'skip'
  );

  const lessons = useQuery(
    api.courses.getCourseLessons,
    id ? { courseId: id as Id<'courses'> } : 'skip'
  );

  // For English courses, fetch English lessons instead
  const englishLessons = useQuery(
    api.englishLessons.getEnglishLessonsByCourse,
    course?.category === 'english' && id ? { courseId: id as Id<'courses'> } : 'skip'
  );

  const isEnglishCourse = course?.category === 'english';

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const progress = useQuery(
    api.courses.getUserCourseProgress,
    convexUser?._id && id
      ? { userId: convexUser._id, courseId: id as Id<'courses'> }
      : 'skip'
  );

  const activeLessons = isEnglishCourse ? englishLessons : lessons;
  const sortedLessons = React.useMemo(() => {
     return activeLessons ? [...activeLessons].sort((a, b) => a.order - b.order) : [];
  }, [activeLessons]);

  const sections = React.useMemo(() => {
    if (!sortedLessons.length) return [];
    const grouped = [];
    const chunkSize = 5;
    for (let i = 0; i < sortedLessons.length; i += chunkSize) {
      grouped.push({
        title: `Section ${Math.floor(i / chunkSize) + 1}`,
        data: sortedLessons.slice(i, i + chunkSize),
      });
    }
    return grouped;
  }, [sortedLessons]);

  if (!course) return <Loading message="Loading course..." />;

  const gradient = categoryGradients[course.category] || COLORS.gradientPrimary;
  const emoji = categoryEmojis[course.category] || '📖';
  const completedLessons = progress?.filter((p) => p.completed).length || 0;
  const totalLessons = course.totalLessons;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const isLessonCompleted = (lessonId: any) =>
    progress?.some((p: any) => p.lessonId === lessonId && p.completed) || false;

  const renderSectionHeader = ({ section: { title } }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );

  const renderLessonItem: SectionListRenderItem<any> = ({ item, index }) => { 
      const isCompleted = isLessonCompleted(item._id);
      // Determine if locked: if it's not the first lesson in the sorted list, check if previous is completed
      // We need global index
      const globalIndex = sortedLessons.findIndex(l => l._id === item._id);
      const isLocked = globalIndex > 0 && !isLessonCompleted(sortedLessons[globalIndex - 1]._id);
      
      return (
        <TouchableOpacity
          style={[styles.lessonRow, isCompleted && styles.lessonCompleted]}
          onPress={() => {
            if (isLocked) {
               Alert.alert('Locked', 'Please complete the previous lesson first!');
               return;
            }
            if (isEnglishCourse) {
              router.push(`/learn/${item._id}?type=english` as any);
            } else {
              router.push(`/learn/${item._id}` as any);
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[
            styles.lessonIcon,
            isCompleted ? styles.iconCompleted : (isLocked ? styles.iconLocked : styles.iconActive)
          ]}>
             <Text style={styles.lessonEmoji}>
               {isCompleted ? '✅' : (isLocked ? '🔒' : '📝')}
             </Text>
          </View>
          <View style={styles.lessonInfo}>
            <Text style={[styles.lessonTitle, isCompleted && styles.textCompleted]}>
              {item.title}
            </Text>
            <Text style={styles.lessonDesc} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
          <Text style={styles.lessonXp}>+{item.xpReward} XP</Text>
        </TouchableOpacity>
      );
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderLessonItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero Header */}
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerNav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.heroEmoji}>{emoji}</Text>
              <Text style={styles.heroTitle}>{course.title}</Text>
              <Text style={styles.heroDesc} numberOfLines={3}>{course.description}</Text>

              <View style={styles.heroPills}>
                <View style={[styles.pill, { backgroundColor: LEVEL_COLORS[course.level] || COLORS.primary }]}>
                  <Text style={styles.pillText}>{course.level}</Text>
                </View>
                <View style={[styles.pillOutline, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.pillOutlineText}>📖 {totalLessons} lessons</Text>
                </View>
                 <View style={[styles.pillOutline, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.pillOutlineText}>⏱️ {course.estimatedDuration}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Progress Card */}
            <View style={{ padding: 20, paddingBottom: 0 }}>
                <Card style={styles.progressCard} variant="elevated">
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>Your Progress</Text>
                    <Text style={styles.progressPct}>{progressPct}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${Math.max(progressPct, 2)}%` }]}
                    />
                  </View>
                  <Text style={styles.progressSub}>
                    {completedLessons} of {totalLessons} lessons completed
                  </Text>
                </Card>
            </View>
          </>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: 40 },
  header: {
    paddingTop: 54, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  sectionHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  
  /* ... kept styles ... */
  headerNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { paddingVertical: 4 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600' },
  heroEmoji: { fontSize: 44, marginBottom: 10 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 16 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: RADIUS.round, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  pillOutline: { borderRadius: RADIUS.round, paddingHorizontal: 12, paddingVertical: 5 },
  pillOutlineText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },

  progressCard: { marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  progressPct: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  progressBarBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSub: { fontSize: 12, color: COLORS.textMuted },
  
  // Lesson Rows
  lessonRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg, marginHorizontal: 20, marginBottom: 12,
    padding: 16, borderRadius: RADIUS.lg, ...SHADOWS.small,
  },
  lessonCompleted: { opacity: 0.8, backgroundColor: '#1A2F1A' },
  lessonIcon: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  iconActive: { backgroundColor: '#2A2F4F' },
  iconCompleted: { backgroundColor: '#1A3D1A' },
  iconLocked: { backgroundColor: '#2A2A2A' },
  lessonEmoji: { fontSize: 18 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  textCompleted: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  lessonDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  lessonXp: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
