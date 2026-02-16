/**
 * PRO & Referral Screen
 * - Show PRO status and validity
 * - Redeem access codes
 * - Share referral code
 * - Contact for PRO access via WhatsApp
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { Loading } from '../components/Loading';

const WHATSAPP_NUMBER = '+916239402519';
const WHATSAPP_MESSAGE = 'Hi I am student at lemolearn and want pro access';

export default function ProReferralScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [accessCode, setAccessCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [referralInput, setReferralInput] = useState('');

  const convexUser = useQuery(api.users.getUser, user?.id ? { clerkId: user.id } : 'skip');
  const proStatus = useQuery(api.accessCodes.getProStatus, user?.id ? { clerkId: user.id } : 'skip');
  const myReferralCode = useQuery(api.referrals.getMyReferralCode, user?.id ? { clerkId: user.id } : 'skip');
  const referralStats = useQuery(api.referrals.getMyReferralStats, user?.id ? { clerkId: user.id } : 'skip');
  const myReferrer = useQuery(api.referrals.getMyReferrer, user?.id ? { clerkId: user.id } : 'skip');

  const redeemCode = useMutation(api.accessCodes.redeemAccessCode);
  const generateCode = useMutation(api.referrals.generateMyReferralCode);
  const applyReferral = useMutation(api.referrals.applyReferralCode);

  if (!user || !convexUser) return <Loading message="Loading..." />;

  const handleRedeemCode = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Error', 'Please enter an access code');
      return;
    }

    setIsRedeeming(true);
    try {
      const result = await redeemCode({
        clerkId: user.id,
        code: accessCode.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 PRO Activated!',
        `You now have ${result.durationDays} days of PRO access!\n\nExpires: ${new Date(result.expiresAt).toLocaleDateString()}`,
        [{ text: 'Awesome!' }]
      );
      setAccessCode('');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to redeem code');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleGenerateReferralCode = async () => {
    try {
      await generateCode({ clerkId: user.id });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleShareReferral = async () => {
    if (!myReferralCode?.code) return;

    try {
      await Share.share({
        message: `🍋 Join me on LemoLearn and start your learning journey! Use my referral code: ${myReferralCode.code}\n\nDownload now and become a champion! 🏆`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    setIsApplyingReferral(true);
    try {
      const result = await applyReferral({
        clerkId: user.id,
        referralCode: referralInput.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Referral Applied!',
        `${result.referrerName} has been credited with 100 XP for referring you!`,
        [{ text: 'Great!' }]
      );
      setReferralInput('');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Invalid referral code');
    } finally {
      setIsApplyingReferral(false);
    }
  };

  const handleContactWhatsApp = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    Linking.openURL(url);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient
        colors={proStatus?.isPro ? ['#FFD700', '#FFA500'] : COLORS.gradientPrimary}
        style={s.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <View style={s.backIcon}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{proStatus?.isPro ? '👑 PRO Member' : '🚀 Go PRO'}</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* PRO Status Card */}
        <View style={[s.statusCard, proStatus?.isPro && s.proCard]}>
          <Text style={s.statusEmoji}>{proStatus?.isPro ? '👑' : '🔒'}</Text>
          <Text style={s.statusTitle}>
            {proStatus?.isPro ? 'PRO Member' : 'Free Account'}
          </Text>
          {proStatus?.isPro ? (
            <>
              <Text style={s.statusSub}>
                {proStatus.daysRemaining} days remaining
              </Text>
              <Text style={s.expiryText}>
                Expires: {new Date(proStatus.expiresAt!).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text style={s.statusSub}>
              Unlock Weekly Tests, Prizes & More!
            </Text>
          )}
        </View>

        {/* Redeem Access Code */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🎫 Redeem Access Code</Text>
          <Text style={s.sectionSub}>Enter your access code to activate PRO</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Enter code (e.g., LEMO2026)"
              value={accessCode}
              onChangeText={(t) => setAccessCode(t.toUpperCase())}
              autoCapitalize="characters"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              onPress={handleRedeemCode}
              disabled={isRedeeming}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={COLORS.gradientPrimary}
                style={s.redeemBtn}
              >
                <Text style={s.redeemBtnText}>
                  {isRedeeming ? '...' : 'Redeem'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact for PRO */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📞 Get Access Code</Text>
          <Text style={s.sectionSub}>Contact Lemo on WhatsApp to get your PRO access code</Text>
          <TouchableOpacity onPress={handleContactWhatsApp} activeOpacity={0.8}>
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              style={s.whatsappBtn}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              <Text style={s.whatsappText}>Message on WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.phoneHint}>+91 62394 02519</Text>
        </View>

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>REFERRALS</Text>
          <View style={s.dividerLine} />
        </View>

        {/* My Referral Code */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>🎁 Your Referral Code</Text>
          <Text style={s.sectionSub}>Share & earn 100 XP per signup, 1000 XP if they go PRO!</Text>

          {myReferralCode?.code ? (
            <View style={s.referralCodeBox}>
              <Text style={s.referralCode}>{myReferralCode.code}</Text>
              <TouchableOpacity onPress={handleShareReferral} style={s.shareBtn}>
                <Ionicons name="share-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleGenerateReferralCode} activeOpacity={0.8}>
              <LinearGradient colors={COLORS.gradientWarm} style={s.generateBtn}>
                <Text style={s.generateBtnText}>Generate My Code</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Stats */}
          {referralStats && (
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={s.statNum}>{referralStats.totalReferrals}</Text>
                <Text style={s.statLabel}>Referrals</Text>
              </View>
              <View style={s.statBox}>
                <Text style={s.statNum}>{referralStats.proReferrals}</Text>
                <Text style={s.statLabel}>Went PRO</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: COLORS.accentGreen }]}>
                  +{referralStats.totalXpEarned}
                </Text>
                <Text style={s.statLabel}>XP Earned</Text>
              </View>
            </View>
          )}
        </View>

        {/* Apply Referral Code (if not already referred) */}
        {!myReferrer && !convexUser.referredBy && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🤝 Have a Referral Code?</Text>
            <Text style={s.sectionSub}>Enter a friend's code to help them earn XP</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="Enter referral code"
                value={referralInput}
                onChangeText={(t) => setReferralInput(t.toUpperCase())}
                autoCapitalize="characters"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                onPress={handleApplyReferral}
                disabled={isApplyingReferral}
                activeOpacity={0.8}
              >
                <LinearGradient colors={COLORS.gradientWarm} style={s.redeemBtn}>
                  <Text style={s.redeemBtnText}>
                    {isApplyingReferral ? '...' : 'Apply'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Already Referred */}
        {myReferrer && (
          <View style={s.referredByBox}>
            <Text style={s.referredByText}>
              ✅ You were referred by <Text style={{ fontWeight: '700' }}>{myReferrer.name}</Text>
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {},
  backIcon: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 10,
    borderRadius: 14,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },

  statusCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOWS.medium,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  proCard: {
    backgroundColor: '#3D351F',
    borderColor: '#FFD700',
  },
  statusEmoji: { fontSize: 48, marginBottom: 10 },
  statusTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statusSub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  expiryText: { fontSize: 13, color: COLORS.accentGreen, marginTop: 8, fontWeight: '600' },

  section: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },

  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  redeemBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
  },
  redeemBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  whatsappText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  phoneHint: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },

  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2F4F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  referralCode: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  shareBtn: {
    backgroundColor: COLORS.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    ...SHADOWS.small,
  },

  generateBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  referredByBox: {
    backgroundColor: '#1A3D1A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  referredByText: { fontSize: 14, color: '#4ADE80' },
});
