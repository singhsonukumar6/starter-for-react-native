/**
 * Contest Results Screen - Shows contest results and rankings
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ContestResultsScreenProps {
  contestId: string;
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_ICONS: (keyof typeof Ionicons.glyphMap)[] = ['trophy', 'medal', 'medal-outline'];

export default function ContestResultsScreen({ contestId }: ContestResultsScreenProps) {
  const router = useRouter();

  const contest = useQuery(api.contests.getContest, { contestId: contestId as any });
  const rankings = useQuery(api.contests.getContestRankings, { contestId: contestId as any });

  if (!contest || !rankings) {
    return <Loading message="Loading results..." />;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getContestTypeLabel = (type: string) => {
    switch (type) {
      case 'coding':
        return 'Coding Challenge';
      case 'english_speech':
        return 'English Speech';
      case 'english_essay':
        return 'English Essay';
      default:
        return type;
    }
  };

  const renderWinner = (submission: any, index: number) => {
    const isTopThree = index < 3;
    
    return (
      <View
        key={submission._id}
        style={[
          styles.winnerCard,
          index === 0 && styles.firstPlace,
          index === 1 && styles.secondPlace,
          index === 2 && styles.thirdPlace,
        ]}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <View style={[styles.medalContainer, { backgroundColor: MEDAL_COLORS[index] + '20' }]}>
              <Ionicons
                name={MEDAL_ICONS[index]}
                size={24}
                color={MEDAL_COLORS[index]}
              />
            </View>
          ) : (
            <View style={styles.rankNumber}>
              <Text style={styles.rankNumberText}>{index + 1}</Text>
            </View>
          )}
        </View>

        <View style={styles.winnerInfo}>
          <Text style={styles.winnerName}>
            {submission.userName || 'Anonymous'}
          </Text>
          {submission.userGroup && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupText}>{submission.userGroup}</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{submission.marks}</Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>
    );
  };

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
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contest Results</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contest Info Card */}
        <View style={styles.contestInfoCard}>
          <View style={styles.contestIconContainer}>
            <Ionicons
              name={contest.contestType === 'coding' ? 'code-slash' : 
                    contest.contestType === 'english_speech' ? 'mic' : 'document-text'}
              size={32}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.contestTitle}>{contest.title}</Text>
          <Text style={styles.contestType}>{getContestTypeLabel(contest.contestType)}</Text>
          
          <View style={styles.contestMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatDate(contest.liveAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{rankings.length} participants</Text>
            </View>
          </View>
        </View>

        {/* Podium for Top 3 */}
        {rankings.length >= 3 && (
          <View style={styles.podiumContainer}>
            <Text style={styles.sectionTitle}>🏆 Winners</Text>
            
            <View style={styles.podium}>
              {/* Second Place */}
              <View style={styles.podiumPlace}>
                <View style={[styles.podiumAvatar, styles.secondPlaceAvatar]}>
                  <Ionicons name="medal" size={24} color="#C0C0C0" />
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {rankings[1]?.userName || 'Anonymous'}
                </Text>
                <Text style={styles.podiumScore}>{rankings[1]?.marks} pts</Text>
                <View style={[styles.podiumStand, styles.secondStand]}>
                  <Text style={styles.podiumRank}>2</Text>
                </View>
              </View>

              {/* First Place */}
              <View style={styles.podiumPlace}>
                <View style={[styles.podiumAvatar, styles.firstPlaceAvatar]}>
                  <Ionicons name="trophy" size={28} color="#FFD700" />
                </View>
                <Text style={[styles.podiumName, styles.firstPlaceName]} numberOfLines={1}>
                  {rankings[0]?.userName || 'Anonymous'}
                </Text>
                <Text style={[styles.podiumScore, styles.firstPlaceScore]}>{rankings[0]?.marks} pts</Text>
                <View style={[styles.podiumStand, styles.firstStand]}>
                  <Text style={styles.podiumRank}>1</Text>
                </View>
              </View>

              {/* Third Place */}
              <View style={styles.podiumPlace}>
                <View style={[styles.podiumAvatar, styles.thirdPlaceAvatar]}>
                  <Ionicons name="medal-outline" size={24} color="#CD7F32" />
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {rankings[2]?.userName || 'Anonymous'}
                </Text>
                <Text style={styles.podiumScore}>{rankings[2]?.marks} pts</Text>
                <View style={[styles.podiumStand, styles.thirdStand]}>
                  <Text style={styles.podiumRank}>3</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Full Rankings */}
        <View style={styles.rankingsSection}>
          <Text style={styles.sectionTitle}>Rankings</Text>
          
          {rankings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyStateText}>No submissions yet</Text>
            </View>
          ) : (
            rankings.map((submission: any, index: number) => renderWinner(submission, index))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contestInfoCard: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  contestIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  contestType: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  contestMeta: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  podiumContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
  },
  podiumPlace: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 3,
  },
  firstPlaceAvatar: {
    borderColor: '#FFD700',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  secondPlaceAvatar: {
    borderColor: '#C0C0C0',
  },
  thirdPlaceAvatar: {
    borderColor: '#CD7F32',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  firstPlaceName: {
    fontSize: 14,
    color: '#FFD700',
  },
  podiumScore: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  firstPlaceScore: {
    color: '#FFD700',
    fontWeight: '600',
  },
  podiumStand: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 8,
  },
  firstStand: {
    height: 80,
    backgroundColor: '#FFD700',
  },
  secondStand: {
    height: 60,
    backgroundColor: '#C0C0C0',
  },
  thirdStand: {
    height: 40,
    backgroundColor: '#CD7F32',
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  rankingsSection: {
    paddingHorizontal: 16,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...SHADOWS.small,
  },
  firstPlace: {
    backgroundColor: '#3D351F',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: '#3D2F1F',
    borderWidth: 1,
    borderColor: '#CD7F32',
  },
  rankContainer: {
    marginRight: 12,
  },
  medalContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  winnerInfo: {
    flex: 1,
  },
  winnerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  groupBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  groupText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
});
