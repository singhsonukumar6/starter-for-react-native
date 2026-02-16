/**
 * Sign Up Screen — Email/Password registration
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert('Oops!', 'Please fill in all fields 📝');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Oops!', 'Passwords don\'t match 🔒');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Oops!', 'Password must be at least 8 characters 💪');
      return;
    }
    try {
      setLoading(true);
      await signUp.create({
        emailAddress: email.trim(),
        password: password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Sign up failed';
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!isLoaded) return;
    try {
      setVerifyLoading(true);
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/onboarding');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Verification failed';
      Alert.alert('Verification Failed', msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow();
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/onboarding');
      }
    } catch (err: any) {
      Alert.alert('Google Sign Up Failed', 'Please try again');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Verification Screen
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.verifyHeader}
          >
            <Text style={styles.verifyEmoji}>📧</Text>
            <Text style={styles.verifyTitle}>Check Your Email!</Text>
            <Text style={styles.verifySubtitle}>
              We sent a verification code to{'\n'}{email}
            </Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <Input
              label="Verification Code"
              placeholder="Enter 6-digit code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              icon="🔑"
            />

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              loading={verifyLoading}
              fullWidth
              size="large"
              icon="✅"
            />

            <TouchableOpacity
              style={styles.resendRow}
              onPress={() => signUp?.prepareEmailAddressVerification({ strategy: 'email_code' })}
            >
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
          colors={COLORS.gradientSuccess}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.logo}>🍋</Text>
          <Text style={styles.appName}>Join LemoLearn!</Text>
          <Text style={styles.tagline}>Start your 100-day learning adventure</Text>
        </LinearGradient>

        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Create Account ✨</Text>
          <Text style={styles.welcomeSub}>It only takes a minute</Text>

          <Input
            label="Email Address"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon="📧"
          />

          <Input
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon="🔒"
            rightIcon={showPassword ? '👁️' : '🙈'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Input
            label="Confirm Password"
            placeholder="Type password again"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            icon="🔒"
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            size="large"
            icon="🚀"
            gradient={COLORS.gradientSuccess}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Sign Up with Google"
            onPress={handleGoogleSignUp}
            variant="outline"
            loading={googleLoading}
            fullWidth
            size="large"
            icon="🔵"
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.signupLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  header: {
    paddingTop: 70, paddingBottom: 40, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  logo: { fontSize: 56, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: 'bold', color: COLORS.white },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  formCard: {
    margin: 20, marginTop: -20, backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl, padding: 24, ...SHADOWS.large,
  },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  welcomeSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14, color: COLORS.textSecondary },
  signupLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  // Verification
  verifyHeader: {
    paddingTop: 100, paddingBottom: 50, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  verifyEmoji: { fontSize: 64, marginBottom: 16 },
  verifyTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  verifySubtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 8, textAlign: 'center',
  },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: COLORS.textSecondary },
  resendLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});
