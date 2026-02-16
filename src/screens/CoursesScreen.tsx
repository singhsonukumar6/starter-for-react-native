/**
 * Courses Screen — Modern, polished course browser
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../components/Loading';
import { CourseCard } from '../components/CourseCard';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const CATEGORIES = [
  { key: 'english', label: 'English' },
  { key: 'abacus', label: 'Abacus' },
  { key: 'vedic', label: 'Vedic Maths' },
  { key: 'coding', label: 'Coding' },
  { key: 'ai', label: 'AI' },
];

export default function CoursesScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const courses = useQuery(api.courses.getCourses);

  // Group courses by category
  const groupedCourses = useMemo(() => {
    if (!courses) return {};
    
    // Sort all by creation time first
    const sorted = [...courses].sort((a, b) => b._creationTime - a._creationTime);
    
    const groups: Record<string, typeof courses> = {};
    
    // Initialize groups based on CATEGORIES order so they appear in order
    CATEGORIES.forEach(cat => {
       groups[cat.key] = [];
    });

    sorted.forEach(course => {
       const cat = course.category || 'other';
       if (!groups[cat]) groups[cat] = [];
       groups[cat].push(course);
    });

    return groups;
  }, [courses]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientCool}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Explore Courses</Text>
            <Text style={styles.headerSub}>
              {courses ? `${courses.length} courses available` : 'Loading...'}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🚀</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!courses ? (
              <Loading message="Loading Library..." />
          ) : (
              // Iterate over predefined categories to maintain order
              [...CATEGORIES, { key: 'other', label: 'Other' }].map((cat) => {
                  const list = groupedCourses[cat.key];
                  if (!list || list.length === 0) return null;
                  
                  return (
                      <View key={cat.key} style={styles.sectionContainer}>
                          <Text style={styles.sectionTitle}>{cat.label}</Text>
                          <View style={styles.gridContainer}>
                              {list.map((item) => (
                                  <View key={item._id} style={styles.gridItemWrapper}>
                                      <CourseCard
                                        title={item.title}
                                        description={item.description}
                                        category={item.category}
                                        totalLessons={item.totalLessons}
                                        estimatedDuration={item.estimatedDuration}
                                        icon={item.thumbnail || item.icon} // Prefer thumbnail, fallback to icon
                                        variant="grid"
                                        onPress={() => router.push(`/course/${item._id}` as any)}
                                      />
                                  </View>
                              ))}
                          </View>
                      </View>
                  );
              })
          )}
          <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: {
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    marginBottom: 0,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  headerIcon: { 
    width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 16, alignItems: 'center', justifyContent: 'center' 
  },
  headerIconText: { fontSize: 24 },

  scrollContent: { padding: 16 },

  sectionContainer: { marginBottom: 24 },
  sectionTitle: {
      fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
      marginBottom: 12, marginLeft: 8 
  },
  
  gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8, // Negative margin to offset item padding
  },
  gridItemWrapper: {
      width: '50%', // 2 columns
      paddingHorizontal: 8, // Gutter
  }
});
