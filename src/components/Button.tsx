/**
 * Enhanced Button Component — Kid-friendly with gradients
 */
import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  gradient?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  textStyle?: { color?: string; fontSize?: number; fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' };
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'medium',
  disabled = false, loading = false, fullWidth = false,
  icon, gradient, style, textStyle,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const paddings = {
    small: { paddingVertical: 10, paddingHorizontal: 20 },
    medium: { paddingVertical: 14, paddingHorizontal: 28 },
    large: { paddingVertical: 18, paddingHorizontal: 36 },
  };
  const fontSizes = { small: 14, medium: 16, large: 18 };
  const isGradient = variant === 'primary' || variant === 'secondary';
  const gradColors = gradient || (variant === 'secondary' ? COLORS.gradientSuccess : COLORS.gradientPrimary);
  const textColor =
    variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white;

  const inner = (
    <View style={[styles.inner, paddings[size], fullWidth && styles.full]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <Text style={{ fontSize: fontSizes[size], marginRight: 6 }}>{icon}</Text> : null}
          <Text style={[styles.text, { fontSize: fontSizes[size], color: textColor }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );

  if (isGradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress} disabled={disabled || loading}
        activeOpacity={0.85} style={[fullWidth && styles.full, style]}
      >
        <LinearGradient
          colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.btn, fullWidth && styles.full, disabled && styles.off, SHADOWS.medium]}
        >
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && { backgroundColor: COLORS.error },
        disabled && styles.off,
        fullWidth && styles.full,
        style,
      ]}
      onPress={handlePress} disabled={disabled || loading} activeOpacity={0.85}
    >
      {inner}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  inner: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { fontWeight: '700', letterSpacing: 0.3 },
  full: { width: '100%' },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary },
  ghost: { backgroundColor: COLORS.surfaceAlt },
  off: { opacity: 0.5 },
});
