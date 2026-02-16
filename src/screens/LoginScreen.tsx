/**
 * Login Screen — Email/Password + Google Sign-In
 * Professional, kid-friendly design
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSignIn = async () => {
    if (!isLoaded) return;
    if (!email.trim() || !password.trim()) {
      Alert.alert('Oops!', 'Please enter your email and password 📧');
      return;
    }
    try {
      setLoading(true);
      const result = await signIn.create({
        identifier: email.trim(),
        password: password,
      });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Sign in failed';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { createdSessionId, setActive: setActiveSession } = await startOAuthFlow();
      if (createdSessionId && setActiveSession) {
        await setActiveSession({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      Alert.alert('Google Sign In Failed', 'Please try again');
    } finally {
      setGoogleLoading(false);
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
        {/* Header */}
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.logo}>🍋</Text>
          <Text style={styles.appName}>LemoLearn</Text>
          <Text style={styles.tagline}>Learn English the fun way!</Text>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
          <Text style={styles.welcomeSub}>Sign in to continue learning</Text>

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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            icon="🔒"
            rightIcon={showPassword ? '👁️' : '🙈'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Button
            title="Sign In"
            onPress={handleEmailSignIn}
            loading={loading}
            fullWidth
            size="large"
            icon="🚀"
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <Button
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            variant="outline"
            loading={googleLoading}
            fullWidth
            size="large"
            icon="🔵"
          />

          {/* Sign Up Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
        </Text>
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
  logo: { fontSize: 64, marginBottom: 8 },
  appName: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, letterSpacing: -0.5 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  formCard: {
    margin: 20, marginTop: -20, backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl, padding: 24, ...SHADOWS.large,
  },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  welcomeSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  divider: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    marginHorizontal: 16, fontSize: 14, color: COLORS.textMuted, fontWeight: '500',
  },
  signupRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 24,
  },
  signupText: { fontSize: 14, color: COLORS.textSecondary },
  signupLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  footer: {
    fontSize: 11, color: COLORS.textMuted, textAlign: 'center',
    paddingHorizontal: 40, paddingBottom: 32, lineHeight: 18,
  },
});
