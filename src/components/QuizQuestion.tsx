/**
 * Quiz Question Component — Multiple choice with feedback
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { checkSuccess } from '../constants/animations';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onAnswer: (selectedIndex: number, isCorrect: boolean) => void;
  onNext?: () => void;
  showFeedback?: boolean;
  isLastQuestion?: boolean;
  preSelectedAnswer?: number | null;
  isReviewMode?: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  questionNumber, totalQuestions, question, options,
  correctIndex, explanation, onAnswer, onNext, showFeedback = true,
  isLastQuestion = false, preSelectedAnswer = null, isReviewMode = false,
}) => {
  const [selected, setSelected] = useState<number | null>(preSelectedAnswer);
  const [answered, setAnswered] = useState(preSelectedAnswer !== null || isReviewMode);

  const handleSelect = (index: number) => {
    if (answered && !isReviewMode) return;
    
    // Optimistic update
    setSelected(index);
    setAnswered(true);
    
    // Calculate correctness
    const isCorrect = index === correctIndex;
    
    Haptics.impactAsync(
      isCorrect ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy
    );
    
    // Pass answer up to parent
    onAnswer(index, isCorrect);
  };

  const getOptionStyle = (index: number) => {
    if (!answered) {
      return selected === index ? styles.optionSelected : styles.option;
    }
    if (index === correctIndex) return styles.optionCorrect;
    if (index === selected && index !== correctIndex) return styles.optionWrong;
    return styles.option;
  };

  const getOptionTextStyle = (index: number) => {
    if (!answered) {
      return selected === index ? styles.optionTextSelected : styles.optionText;
    }
    if (index === correctIndex) return styles.optionTextCorrect;
    if (index === selected && index !== correctIndex) return styles.optionTextWrong;
    return styles.optionText;
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressRow}>
        <Text style={styles.qNum}>Q{questionNumber}/{totalQuestions}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${(questionNumber / totalQuestions) * 100}%`,
          }]} />
        </View>
      </View>

      {/* Question */}
      <Text style={styles.question}>{question}</Text>

      {/* Options */}
      <View style={styles.optionsWrap}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={getOptionStyle(i)}
            onPress={() => handleSelect(i)}
            activeOpacity={answered ? 1 : 0.7}
            disabled={answered}
          >
            <View style={styles.letterWrap}>
              <Text style={styles.letter}>{optionLetters[i]}</Text>
            </View>
            <Text style={getOptionTextStyle(i)}>{opt}</Text>
            {answered && i === correctIndex && (
              <Text style={styles.checkmark}>✅</Text>
            )}
            {answered && i === selected && i !== correctIndex && (
              <Text style={styles.crossmark}>❌</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Feedback */}
      {answered && showFeedback && (
        <View style={[
          styles.feedback,
          selected === correctIndex ? styles.feedbackCorrect : styles.feedbackWrong,
        ]}>
          {selected === correctIndex ? (
            <View style={styles.feedbackRow}>
              <LottieView
                source={checkSuccess}
                autoPlay
                loop={false}
                style={styles.miniLottie}
              />
              <View style={styles.feedbackTextWrap}>
                <Text style={styles.feedbackTitle}>Correct! 🎉</Text>
                <Text style={styles.feedbackExplain}>{explanation}</Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.feedbackTitleWrong}>Not quite! 🤔</Text>
              <Text style={styles.feedbackExplain}>{explanation}</Text>
            </View>
          )}
        </View>
      )}

      {/* Next Question Button */}
      {answered && onNext && !isReviewMode && (
        <TouchableOpacity 
          onPress={onNext} 
          activeOpacity={0.8}
          style={styles.nextButtonContainer}
        >
          <LinearGradient
            colors={COLORS.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'See Results' : 'Next Question →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  qNum: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  progressBar: {
    flex: 1, height: 6, backgroundColor: COLORS.surfaceAlt,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.primary, borderRadius: 3,
  },
  question: {
    fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
    lineHeight: 28, marginBottom: 20,
  },
  optionsWrap: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.border, ...SHADOWS.small,
  },
  optionSelected: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  optionCorrect: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#1A3D1A', borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: '#4CAF50',
  },
  optionWrong: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#3D1A1A', borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: '#EF5350',
  },
  letterWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  letter: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  optionText: { flex: 1, fontSize: 15, color: COLORS.textPrimary, lineHeight: 21 },
  optionTextSelected: { flex: 1, fontSize: 15, color: COLORS.primary, fontWeight: '600', lineHeight: 21 },
  optionTextCorrect: { flex: 1, fontSize: 15, color: '#2E7D32', fontWeight: '600', lineHeight: 21 },
  optionTextWrong: { flex: 1, fontSize: 15, color: '#C62828', fontWeight: '600', lineHeight: 21 },
  checkmark: { fontSize: 18 },
  crossmark: { fontSize: 18 },
  feedback: {
    marginTop: 16, padding: 16, borderRadius: RADIUS.lg,
  },
  feedbackCorrect: { backgroundColor: '#E8F5E9' },
  feedbackWrong: { backgroundColor: '#FFF3E0' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center' },
  miniLottie: { width: 40, height: 40, marginRight: 10 },
  feedbackTextWrap: { flex: 1 },
  feedbackTitle: { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  feedbackTitleWrong: { fontSize: 16, fontWeight: '700', color: '#E65100', marginBottom: 4 },
  feedbackExplain: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  nextButtonContainer: {
    marginTop: 24,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
