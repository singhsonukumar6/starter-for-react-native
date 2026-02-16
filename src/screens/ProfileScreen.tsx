/**
 * Profile Screen — Professional kid-friendly profile
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const streakInfo = useQuery(
    api.daily.getStreakInfo,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const certificates = useQuery(
    api.courses.getUserCertificates,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const achievements = useQuery(
    api.achievements.getUserAchievements,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const proStatus = useQuery(
    api.accessCodes.getProStatus,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Challenge stats
  const challengeStats = useQuery(
    api.codingChallenges.getUserStats,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  if (!user) return null;

  const initial = (convexUser?.name || user.firstName || 'S').charAt(0).toUpperCase();
  const groupLabel = convexUser?.group
    ? convexUser.group.charAt(0).toUpperCase() + convexUser.group.slice(1)
    : '';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Gradient Header */}
      <LinearGradient
        colors={proStatus?.isPro ? ['#FFD700', '#FFA500'] : COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {proStatus?.isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>👑 PRO</Text>
          </View>
        )}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{convexUser?.name || user.fullName || user.firstName}</Text>
        <Text style={styles.email}>{user.primaryEmailAddress?.emailAddress}</Text>
        {convexUser && (
          <View style={styles.classPill}>
            <Text style={styles.classText}>Class {convexUser.class} • {groupLabel}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* PRO Status Card */}
        <TouchableOpacity 
          onPress={() => router.push('/pro-referral')} 
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={proStatus?.isPro ? ['#4A3F00', '#3D3500'] : ['#2A2F4F', '#1E2340']}
            style={styles.proCard}
          >
            <View style={styles.proCardContent}>
              <Text style={styles.proCardEmoji}>{proStatus?.isPro ? '👑' : '🚀'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.proCardTitle}>
                  {proStatus?.isPro ? 'PRO Member' : 'Upgrade to PRO'}
                </Text>
                <Text style={styles.proCardSub}>
                  {proStatus?.isPro 
                    ? `${proStatus.daysRemaining} days remaining` 
                    : 'Weekly Tests, Prizes & More!'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={proStatus?.isPro ? '#D4A017' : COLORS.primary} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNum}>{streakInfo?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNum}>{convexUser?.xp || 0}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statNum}>{certificates?.length || 0}</Text>
            <Text style={styles.statLabel}>Certs</Text>
          </View>
        </View>

        {/* Coding Challenges Stats */}
        {challengeStats && (
          <TouchableOpacity onPress={() => router.push('/challenges')} activeOpacity={0.8}>
            <Card variant="elevated" style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>💻 Coding Challenges</Text>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
              <View style={styles.challengeStatsRow}>
                <View style={styles.challengeStat}>
                  <Text style={styles.challengeStatValue}>{challengeStats.totalSolved}</Text>
                  <Text style={styles.challengeStatLabel}>Solved</Text>
                </View>
                <View style={styles.challengeStat}>
                  <Text style={styles.challengeStatValue}>{challengeStats.totalPoints}</Text>
                  <Text style={styles.challengeStatLabel}>Points</Text>
                </View>
                <View style={styles.challengeStat}>
                  <Text style={styles.challengeStatValue}>#{challengeStats.rank || '-'}</Text>
                  <Text style={styles.challengeStatLabel}>Rank</Text>
                </View>
              </View>
              <View style={styles.difficultyBar}>
                <View style={styles.difficultyRow}>
                  <Text style={[styles.difficultyLabel, { color: '#10B981' }]}>Easy</Text>
                  <View style={styles.difficultyProgress}>
                    <View style={[styles.difficultyFill, { width: `${(challengeStats.easySolved / Math.max(challengeStats.easyTotal, 1)) * 100}%`, backgroundColor: '#10B981' }]} />
                  </View>
                  <Text style={styles.difficultyCount}>{challengeStats.easySolved}/{challengeStats.easyTotal}</Text>
                </View>
                <View style={styles.difficultyRow}>
                  <Text style={[styles.difficultyLabel, { color: '#F59E0B' }]}>Medium</Text>
                  <View style={styles.difficultyProgress}>
                    <View style={[styles.difficultyFill, { width: `${(challengeStats.mediumSolved / Math.max(challengeStats.mediumTotal, 1)) * 100}%`, backgroundColor: '#F59E0B' }]} />
                  </View>
                  <Text style={styles.difficultyCount}>{challengeStats.mediumSolved}/{challengeStats.mediumTotal}</Text>
                </View>
                <View style={styles.difficultyRow}>
                  <Text style={[styles.difficultyLabel, { color: '#EF4444' }]}>Hard</Text>
                  <View style={styles.difficultyProgress}>
                    <View style={[styles.difficultyFill, { width: `${(challengeStats.hardSolved / Math.max(challengeStats.hardTotal, 1)) * 100}%`, backgroundColor: '#EF4444' }]} />
                  </View>
                  <Text style={styles.difficultyCount}>{challengeStats.hardSolved}/{challengeStats.hardTotal}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Navigation Links - PROGRESS & LEADERBOARD moved here */}
        <View style={styles.navLinksRow}>
          <TouchableOpacity 
            style={styles.navLinkButton} 
            onPress={() => router.push('/progress')}
            activeOpacity={0.7}
          >
            <View style={[styles.navIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Text style={styles.navIcon}>📈</Text>
            </View>
            <Text style={styles.navLabel}>My Progress</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navLinkButton} 
            onPress={() => router.push('/leaderboard')}
            activeOpacity={0.7}
          >
             <View style={[styles.navIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Text style={styles.navIcon}>🏆</Text>
            </View>
            <Text style={styles.navLabel}>Leaderboard</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <Card variant="elevated">
          <Text style={styles.cardTitle}>📋 Account Information</Text>
          <InfoRow label="Full Name" value={convexUser?.name || user.fullName || '-'} />
          <InfoRow label="Email" value={user.primaryEmailAddress?.emailAddress || '-'} />
          <InfoRow label="Class" value={convexUser ? `Class ${convexUser.class}` : '-'} />
          <InfoRow label="Group" value={groupLabel || '-'} />
          <InfoRow label="Parent Email" value={convexUser?.parentEmail || '-'} last />
        </Card>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <Card variant="elevated">
            <Text style={styles.cardTitle}>🏆 Achievements</Text>
            <View style={styles.badgeGrid}>
              {achievements.map((badge) => (
                <View key={badge._id} style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}>
                  <Text style={[styles.badgeIcon, !badge.unlocked && { opacity: 0.5 }]}>{badge.icon}</Text>
                  <Text style={styles.badgeTitle} numberOfLines={1}>{badge.title}</Text>
                  <Text style={styles.badgePoints}>+{badge.xpToken} XP</Text>
                </View>
              ))}
            </View>
            <Text style={styles.badgeHint}>Unlock badges to earn extra XP!</Text>
          </Card>
        )}

        {/* Certificates */}
        {certificates && certificates.length > 0 && (
          <Card variant="elevated">
            <Text style={styles.cardTitle}>🏅 Certificates</Text>
            {certificates.map((cert, i) => (
              <View key={cert._id} style={[styles.certRow, i === certificates.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.certEmoji}>📜</Text>
                <View style={styles.certInfo}>
                  <Text style={styles.certId}>{cert.certificateId}</Text>
                  <Text style={styles.certDate}>
                    {new Date(cert.issuedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Actions */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          icon="👋"
          style={{ marginTop: 8 }}
        />

        <Text style={styles.version}>LemoLearn v1.0.0 🍋</Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[infoStyles.row, !last && infoStyles.border]}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  label: { fontSize: 14, color: COLORS.textMuted },
  value: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, maxWidth: '60%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 70, paddingBottom: 32, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  proBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  proBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  name: { fontSize: 26, fontWeight: 'bold', color: COLORS.white },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  classPill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.round,
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 10,
  },
  classText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  content: { padding: 20, paddingTop: 24 },

  // PRO Card
  proCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.small,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  proCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proCardEmoji: { fontSize: 32, marginRight: 12 },
  proCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  proCardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  navLinksRow: {
    gap: 12,
    marginBottom: 20,
  },
  navLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: RADIUS.xl,
    ...SHADOWS.small,
  },
  navIconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  navIcon: { fontSize: 18 },
  navLabel: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '600', 
    color: COLORS.textPrimary 
  },

  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    padding: 20, marginBottom: 20, justifyContent: 'space-around',
    alignItems: 'center', ...SHADOWS.medium,
  },
  statItem: { alignItems: 'center' },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  certRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  certEmoji: { fontSize: 24, marginRight: 12 },
  certInfo: { flex: 1 },
  certId: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  certDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  // Badges
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  badgeItem: {
    width: '30%', alignItems: 'center', padding: 10,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeLocked: { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border, opacity: 0.6 },
  badgeIcon: { fontSize: 32, marginBottom: 4 },
  badgeTitle: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  badgePoints: { fontSize: 10, color: COLORS.primary, marginTop: 2, fontWeight: '700' },
  badgeHint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },

  // Challenge Stats Card
  challengeCard: {
    marginBottom: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  challengeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  challengeStat: {
    alignItems: 'center',
  },
  challengeStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  challengeStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  difficultyBar: {
    gap: 8,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyLabel: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyProgress: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  difficultyFill: {
    height: '100%',
    borderRadius: 3,
  },
  difficultyCount: {
    width: 40,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },

  version: {
    textAlign: 'center', fontSize: 13, color: COLORS.textMuted,
    marginTop: 24, marginBottom: 40,
  },
});
