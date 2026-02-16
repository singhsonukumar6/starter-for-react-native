/**
 * Enhanced Card Component
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children, style, onPress, variant = 'default',
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && SHADOWS.large,
    variant === 'outlined' && styles.outlined,
    variant === 'default' && SHADOWS.small,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 16,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
});
