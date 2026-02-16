/**
 * LemoLearn Design System
 * Dark Theme - Consistent across all screens
 */

export const COLORS = {
  // Primary palette - vibrant purple/indigo
  primary: '#8B7CF7',
  primaryDark: '#7C6FE8',
  primaryLight: '#A594FF',
  primaryBg: '#1E1B4B',

  // Accent colors - energetic & playful
  accent: '#FF6B6B',
  accentOrange: '#FFA726',
  accentGreen: '#4CAF50',
  accentBlue: '#42A5F5',
  accentPink: '#FF4081',
  accentYellow: '#FFD54F',
  accentTeal: '#26C6DA',

  // Gradients - optimized for dark mode
  gradientPrimary: ['#6C63FF', '#A855F7'] as const,
  gradientWarm: ['#FF6B6B', '#FFA726'] as const,
  gradientCool: ['#42A5F5', '#26C6DA'] as const,
  gradientSuccess: ['#4CAF50', '#81C784'] as const,
  gradientSunset: ['#FF6B6B', '#FFD54F'] as const,
  gradientDark: ['#1F1F2E', '#2D2D44'] as const,

  // Category colors
  english: '#8B7CF7',
  abacus: '#FF6B6B',
  vedic: '#FFA726',
  coding: '#42A5F5',
  ai: '#A855F7',

  // Dark theme neutrals
  white: '#FFFFFF',
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceAlt: '#252542',
  surfaceLight: '#2D2D4A',
  border: '#3D3D5C',
  borderLight: '#2A2A44',

  // Text - optimized for dark backgrounds
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C8',
  textMuted: '#6B6B8A',
  textWhite: '#FFFFFF',
  textLink: '#A594FF',

  // Semantic
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#42A5F5',

  // Streak fire
  streak: '#FF6B6B',
  streakGlow: '#FFD54F',

  // Card backgrounds
  cardBg: '#1A1A2E',
  cardBgLight: '#252542',
  cardBgElevated: '#2D2D4A',

  // Input backgrounds
  inputBg: '#252542',
  inputBgLight: '#2D2D4A',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Action card backgrounds (for quick actions)
  actionEnglish: '#2A1F4E',
  actionAbacus: '#3D1F1F',
  actionVedic: '#3D2F1F',
  actionCoding: '#1F2F3D',
  actionContest: '#3D1F2F',
  actionLeaderboard: '#1F1F3D',
};

export const FONTS = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.textMuted,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const EMOJIS = {
  categories: {
    english: '📚',
    abacus: '🧮',
    vedic: '🔢',
    coding: '💻',
    ai: '🤖',
  },
  streak: '🔥',
  trophy: '🏆',
  star: '⭐',
  rocket: '🚀',
  brain: '🧠',
  target: '🎯',
  celebration: '🎉',
  book: '📖',
  pencil: '✏️',
  check: '✅',
  lock: '🔒',
  crown: '👑',
  lemon: '🍋',
  wave: '👋',
  sparkle: '✨',
};

// Dark theme specific utilities
export const getScreenStyles = () => ({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  surface: {
    backgroundColor: COLORS.surface,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
  },
});

// Action card background colors for dark theme
export const ACTION_CARD_COLORS = {
  english: COLORS.actionEnglish,
  abacus: COLORS.actionAbacus,
  vedic: COLORS.actionVedic,
  coding: COLORS.actionCoding,
  contest: COLORS.actionContest,
  leaderboard: COLORS.actionLeaderboard,
  daily: COLORS.actionEnglish,
  tests: COLORS.actionVedic,
  challenges: COLORS.actionCoding,
};
