/**
 * Loading Component with Lottie
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { loadingDots } from '../constants/animations';
import { COLORS } from '../constants/theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ message, fullScreen = true }) => {
  return (
    <View style={[styles.container, !fullScreen && styles.inline]}>
      <LottieView
        source={loadingDots}
        autoPlay
        loop
        style={styles.lottie}
      />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  inline: { flex: 0, padding: 20 },
  lottie: { width: 80, height: 40 },
  text: { fontSize: 14, color: COLORS.textSecondary, marginTop: 12 },
});
