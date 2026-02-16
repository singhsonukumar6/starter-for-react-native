/**
 * Progress Screen — Track learning progress with Convex data
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/Card';
import { StreakDisplay } from '../components/StreakDisplay';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS } from '../constants/theme';

export default function ProgressScreen() {
  const { user: clerkUser } = useUser();

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const streakInfo = useQuery(
    api.daily.getStreakInfo,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const certificates = useQuery(
    api.courses.getUserCertificates,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  if (!clerkUser) return <Loading message="Loading progress..." />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientSunset}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Progress 📈</Text>
        <Text style={styles.headerSub}>Track your learning journey</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Streak Display */}
        <StreakDisplay
          currentDay={streakInfo?.currentStreak || 0}
          totalDays={100}
        />

        {/* Detailed Stats */}
        <Card variant="elevated">
          <Text style={styles.cardTitle}>📊 Streak Statistics</Text>
          <StatRow emoji="🔥" label="Current Streak" value={`${streakInfo?.currentStreak || 0} days`} />
          <StatRow emoji="🏆" label="Longest Streak" value={`${streakInfo?.longestStreak || 0} days`} />
          <StatRow emoji="⭐" label="Total Days Completed" value={`${streakInfo?.totalDaysCompleted || 0} days`} last />
        </Card>

        {/* Milestones */}
        <Card variant="elevated">
          <Text style={styles.cardTitle}>🎯 Milestones</Text>
          <View style={styles.milestoneGrid}>
            {[7, 14, 21, 30, 50, 75, 100].map((milestone) => {
              const reached = (streakInfo?.longestStreak || 0) >= milestone;
              return (
                <View key={milestone} style={[styles.milestone, reached && styles.milestoneReached]}>
                  <Text style={styles.milestoneNum}>{milestone}</Text>
                  <Text style={styles.milestoneLabel}>days</Text>
                  {reached && <Text style={styles.milestoneCheck}>✅</Text>}
                </View>
              );
            })}
          </View>
        </Card>

        {/* Certificates */}
        <Card variant="elevated">
          <Text style={styles.cardTitle}>🏅 Certificates Earned</Text>
          {certificates && certificates.length > 0 ? (
            certificates.map((cert) => (
              <View key={cert._id} style={styles.certRow}>
                <Text style={styles.certEmoji}>📜</Text>
                <View style={styles.certInfo}>
                  <Text style={styles.certId}>{cert.certificateId}</Text>
                  <Text style={styles.certDate}>
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCert}>
              <Text style={styles.emptyCertEmoji}>🎓</Text>
              <Text style={styles.emptyCertText}>Complete courses to earn certificates!</Text>
            </View>
          )}
        </Card>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  );
}

function StatRow({ emoji, label, value, last }: { emoji: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[statStyles.row, !last && statStyles.border]}>
      <View style={statStyles.left}>
        <Text style={statStyles.emoji}>{emoji}</Text>
        <Text style={statStyles.label}>{label}</Text>
      </View>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 20 },
  label: { fontSize: 15, color: COLORS.textSecondary },
  value: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  content: { padding: 20, paddingTop: 24 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  milestoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  milestone: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceAlt, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  milestoneReached: { backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primary },
  milestoneNum: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  milestoneLabel: { fontSize: 10, color: COLORS.textMuted },
  milestoneCheck: { position: 'absolute', top: -4, right: -4, fontSize: 16 },
  certRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  certEmoji: { fontSize: 24, marginRight: 12 },
  certInfo: { flex: 1 },
  certId: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  certDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  emptyCert: { alignItems: 'center', paddingVertical: 20 },
  emptyCertEmoji: { fontSize: 40, marginBottom: 8 },
  emptyCertText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
