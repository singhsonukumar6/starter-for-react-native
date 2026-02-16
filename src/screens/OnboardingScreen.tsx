/**
 * Onboarding Screen — Collect profile info after sign up
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const CLASS_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useUser();
  const createUser = useMutation(api.users.createUser);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [parentEmail, setParentEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedClass) {
      Alert.alert('Pick your class!', 'Tap on your class number above');
      return;
    }
    if (!parentEmail.trim() || !parentEmail.includes('@')) {
      Alert.alert('Parent Email', 'Please enter a valid parent email');
      return;
    }

    try {
      setLoading(true);
      if (!user) throw new Error('User not found');

      await createUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || 'Student',
        email: user.primaryEmailAddress?.emailAddress || '',
        class: selectedClass,
        parentEmail: parentEmail.trim(),
        imageUrl: user.imageUrl,
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Oops!', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.greeting}>Hi, {user?.firstName || 'there'}!</Text>
          <Text style={styles.subtitle}>Let's set up your learning profile</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.label}>Which class are you in? 🎓</Text>
          <View style={styles.classGrid}>
            {CLASS_OPTIONS.map((cls) => (
              <TouchableOpacity
                key={cls}
                onPress={() => setSelectedClass(cls)}
                style={[styles.classBtn, selectedClass === cls && styles.classBtnActive]}
              >
                {selectedClass === cls ? (
                  <LinearGradient colors={COLORS.gradientPrimary} style={styles.classBtnGrad}>
                    <Text style={styles.classTxtActive}>{cls}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.classTxt}>{cls}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedClass && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupText}>
                {selectedClass <= 3 ? '🌱 Junior (Class 1-3)' :
                  selectedClass <= 6 ? '🌿 Intermediate (Class 4-6)' :
                    '🌳 Senior (Class 7-10)'}
              </Text>
            </View>
          )}

          <Input
            label="Parent's Email Address"
            placeholder="parent@email.com"
            value={parentEmail}
            onChangeText={setParentEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="👨‍👩‍👧"
          />
          <Text style={styles.hint}>We'll send weekly progress reports to your parent</Text>

          <Button
            title="Start Learning! 🚀"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="large"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  header: {
    paddingTop: 80, paddingBottom: 40, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  wave: { fontSize: 56, marginBottom: 8 },
  greeting: { fontSize: 30, fontWeight: 'bold', color: COLORS.white },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  formCard: {
    margin: 20, marginTop: -20, backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl, padding: 24, ...SHADOWS.large,
  },
  label: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  classBtn: {
    width: 56, height: 56, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceAlt, justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  classBtnActive: { borderWidth: 0 },
  classBtnGrad: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  classTxt: { fontSize: 20, fontWeight: '700', color: COLORS.textSecondary },
  classTxtActive: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  groupBadge: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 20, alignItems: 'center',
  },
  groupText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: -8, marginBottom: 20, marginLeft: 4 },
});
