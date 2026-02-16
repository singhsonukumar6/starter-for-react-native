/**
 * English Lesson Player - Professional Duolingo-style lesson player
 * Supports TTS, MCQ, fill-in-the-blanks, arrange words, match pairs, and listen questions
 * Features: Smooth animations, interactive feedback, professional UI
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Easing,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types
interface ContentBlock {
  type: string;
  title?: string;
  content: string;
  pronunciation?: string;
  audioText?: string;
  emoji?: string;
  examples?: string[];
}

interface Question {
  type: string;
  question: string;
  audioText?: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  correctOrder?: string[];
  pairs?: { left: string; right: string }[];
  explanation: string;
  hint?: string;
}

interface EnglishLesson {
  _id: string;
  title: string;
  description: string;
  xpReward: number;
  content: ContentBlock[];
  questions: Question[];
}

interface EnglishLessonPlayerProps {
  lesson: EnglishLesson;
  onComplete: (score: number, xpEarned: number) => void;
  onExit: () => void;
}

// Animated Button Component
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// TTS Button Component with animation
const TTSButton: React.FC<{ text: string; size?: number; color?: string }> = ({ 
  text, 
  size = 28,
  color = COLORS.primary 
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSpeak = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    
    // Pulse animation while speaking
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Speech.speak(text, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => {
        setIsSpeaking(false);
        scaleAnim.stopAnimation();
        scaleAnim.setValue(1);
      },
      onError: () => {
        setIsSpeaking(false);
        scaleAnim.stopAnimation();
        scaleAnim.setValue(1);
      },
    });
  };

  return (
    <TouchableOpacity onPress={handleSpeak} activeOpacity={0.7}>
      <Animated.View 
        style={[
          styles.ttsButton, 
          { transform: [{ scale: scaleAnim }] },
          isSpeaking && { backgroundColor: COLORS.primaryLight }
        ]}
      >
        <Ionicons
          name={isSpeaking ? 'stop-circle' : 'volume-high'}
          size={size}
          color={isSpeaking ? COLORS.white : color}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Content Block Component with animations
const ContentBlockCard: React.FC<{ block: ContentBlock; index: number }> = ({ block, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getBlockStyle = () => {
    switch (block.type) {
      case 'rule':
        return { 
          bg: COLORS.primaryBg, 
          border: COLORS.primary, 
          icon: 'book-outline', 
          label: 'GRAMMAR RULE',
          iconColor: COLORS.primary 
        };
      case 'example':
        return { 
          bg: '#E8F5E9', 
          border: COLORS.success, 
          icon: 'bulb-outline', 
          label: 'EXAMPLE',
          iconColor: COLORS.success 
        };
      case 'pronunciation':
        return { 
          bg: '#FCE4EC', 
          border: COLORS.accentPink, 
          icon: 'mic-outline', 
          label: 'PRONUNCIATION',
          iconColor: COLORS.accentPink 
        };
      case 'tip':
        return { 
          bg: '#FFF8E1', 
          border: COLORS.warning, 
          icon: 'star-outline', 
          label: 'PRO TIP',
          iconColor: COLORS.warning 
        };
      case 'highlight':
        return { 
          bg: '#FFEBEE', 
          border: COLORS.accent, 
          icon: 'flame-outline', 
          label: 'KEY POINT',
          iconColor: COLORS.accent 
        };
      default:
        return { 
          bg: COLORS.surface, 
          border: COLORS.border, 
          icon: 'document-text-outline', 
          label: 'LEARN',
          iconColor: COLORS.textSecondary 
        };
    }
  };

  const style = getBlockStyle();

  return (
    <Animated.View 
      style={[
        styles.contentBlock, 
        { 
          backgroundColor: style.bg, 
          borderLeftColor: style.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.blockHeader}>
        <View style={[styles.blockBadge, { backgroundColor: style.border }]}>
          <Ionicons name={style.icon as any} size={14} color={COLORS.white} />
          <Text style={styles.blockBadgeText}>{style.label}</Text>
        </View>
        {block.emoji && <Text style={styles.blockEmoji}>{block.emoji}</Text>}
      </View>
      
      {block.title && <Text style={styles.blockTitle}>{block.title}</Text>}
      
      <View style={styles.blockContentRow}>
        <Text style={styles.blockContent}>{block.content}</Text>
        {block.audioText && <TTSButton text={block.audioText} />}
      </View>

      {block.pronunciation && (
        <View style={styles.pronunciationContainer}>
          <MaterialCommunityIcons name="account-voice" size={16} color={COLORS.textMuted} />
          <Text style={styles.pronunciation}>/{block.pronunciation}/</Text>
        </View>
      )}

      {block.examples && block.examples.length > 0 && (
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesTitle}>Examples:</Text>
          {block.examples.map((example, i) => (
            <View key={i} style={styles.exampleRow}>
              <View style={styles.exampleNumber}>
                <Text style={styles.exampleNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.exampleText}>{example}</Text>
              <TTSButton text={example} size={20} color={COLORS.textSecondary} />
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

// MCQ Question Component with animations
const MCQQuestion: React.FC<{
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  showExplanation: boolean;
}> = ({ question, onAnswer, showExplanation }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const isCorrect = selectedIndex === question.correctIndex;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    
    setAnimatingIndex(index);
    setSelectedIndex(index);
    
    if (index !== question.correctIndex) {
      // Shake animation for wrong answer
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    
    setTimeout(() => {
      setAnimatingIndex(null);
      onAnswer(isCorrect);
    }, 1200);
  };

  return (
    <Animated.View style={[styles.questionContainer, { transform: [{ translateX: shakeAnim }] }]}>
      {question.audioText && (
        <TouchableOpacity 
          style={styles.questionAudioButton}
          onPress={() => Speech.speak(question.audioText!, { language: 'en-US', rate: 0.85 })}
        >
          <Ionicons name="volume-high" size={24} color={COLORS.white} />
          <Text style={styles.questionAudioText}>Listen to question</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.questionText}>{question.question}</Text>
      
      <View style={styles.optionsGrid}>
        {question.options?.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = index === question.correctIndex;
          const showCorrect = selectedIndex !== null && isCorrectOption;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && isCorrect && styles.correctOption,
                isSelected && !isCorrect && styles.wrongOption,
                showCorrect && !isSelected && styles.revealCorrectOption,
                selectedIndex !== null && !isSelected && !isCorrectOption && styles.disabledOption,
              ]}
              onPress={() => handleSelect(index)}
              disabled={selectedIndex !== null}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIndicator,
                  isSelected && isCorrect && styles.correctIndicator,
                  isSelected && !isCorrect && styles.wrongIndicator,
                ]}>
                  {isSelected ? (
                    <Ionicons 
                      name={isCorrect ? 'checkmark' : 'close'} 
                      size={16} 
                      color={COLORS.white} 
                    />
                  ) : (
                    <Text style={styles.optionIndicatorText}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {showExplanation && selectedIndex !== null && (
        <View style={[
          styles.explanationBox, 
          isCorrect ? styles.correctExplanation : styles.wrongExplanation
        ]}>
          <View style={styles.explanationIcon}>
            <Ionicons 
              name={isCorrect ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={isCorrect ? COLORS.success : COLORS.error} 
            />
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// Fill in the Blanks Question Component
const FillBlankQuestion: React.FC<{
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  showExplanation: boolean;
}> = ({ question, onAnswer, showExplanation }) => {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isCorrect = answer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    setTimeout(() => onAnswer(isCorrect), 1500);
  };

  // Replace ___ with input
  const parts = question.question.split('___');

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionLabel}>Fill in the blank:</Text>
      
      <View style={styles.fillBlankContainer}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <Text style={styles.fillBlankText}>{part}</Text>
            {index < parts.length - 1 && (
              <View style={[
                styles.fillBlankInputWrapper,
                submitted && (isCorrect ? styles.correctInputWrapper : styles.wrongInputWrapper)
              ]}>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.fillBlankInput,
                    submitted && (isCorrect ? styles.correctInput : styles.wrongInput),
                  ]}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="type here..."
                  placeholderTextColor={COLORS.textMuted}
                  editable={!submitted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>

      {!submitted && (
        <TouchableOpacity 
          style={[styles.submitButton, !answer.trim() && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={!answer.trim()}
          activeOpacity={0.8}
        >
          <LinearGradient 
            colors={answer.trim() ? COLORS.gradientPrimary : ['#ccc', '#aaa']} 
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>Check Answer</Text>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {showExplanation && submitted && (
        <View style={[styles.explanationBox, isCorrect ? styles.correctExplanation : styles.wrongExplanation]}>
          <View style={styles.explanationIcon}>
            <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={24} color={isCorrect ? COLORS.success : COLORS.error} />
          </View>
          <Text style={styles.explanationText}>
            {isCorrect ? 'Correct! ' : `The correct answer is "${question.correctAnswer}". `}
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};

// Arrange Words Question Component
const ArrangeQuestion: React.FC<{
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  showExplanation: boolean;
}> = ({ question, onAnswer, showExplanation }) => {
  const [words, setWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Shuffle words for display
    const shuffled = [...(question.correctOrder || [])].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setWords([]);
    setSubmitted(false);
  }, [question]);

  const isCorrect = JSON.stringify(words) === JSON.stringify(question.correctOrder);

  const addWord = (word: string, index: number) => {
    if (submitted) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWords([...words, word]);
    setAvailableWords(availableWords.filter((_, i) => i !== index));
  };

  const removeWord = (index: number) => {
    if (submitted) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const word = words[index];
    setAvailableWords([...availableWords, word]);
    setWords(words.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (words.length === 0) return;
    setSubmitted(true);
    setTimeout(() => onAnswer(isCorrect), 1500);
  };

  const resetWords = () => {
    const shuffled = [...(question.correctOrder || [])].sort(() => Math.random() - 0.5);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAvailableWords(shuffled);
    setWords([]);
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionLabel}>Arrange the words in correct order:</Text>
      <Text style={styles.questionText}>{question.question}</Text>
      
      {/* Selected words area */}
      <View style={[styles.arrangeAnswerArea, submitted && (isCorrect ? styles.correctAnswerArea : styles.wrongAnswerArea)]}>
        <Text style={styles.arrangeAreaLabel}>Your answer:</Text>
        <View style={styles.arrangeContainer}>
          {words.length === 0 && !submitted && (
            <Text style={styles.arrangePlaceholder}>Tap words below to build your answer</Text>
          )}
          {words.map((word, index) => (
            <TouchableOpacity
              key={`selected-${index}`}
              style={[styles.wordChip, styles.selectedWordChip]}
              onPress={() => removeWord(index)}
              disabled={submitted}
              activeOpacity={0.7}
            >
              <Text style={styles.wordChipText}>{word}</Text>
              {!submitted && <Ionicons name="close-circle" size={16} color={COLORS.white} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Available words */}
      <View style={styles.arrangeWordsArea}>
        <View style={styles.arrangeContainer}>
          {availableWords.map((word, index) => (
            <TouchableOpacity
              key={`available-${index}`}
              style={[styles.wordChip, styles.availableWordChip]}
              onPress={() => addWord(word, index)}
              disabled={submitted}
              activeOpacity={0.7}
            >
              <Text style={styles.availableWordChipText}>{word}</Text>
              <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      {!submitted && (
        <View style={styles.arrangeActions}>
          <TouchableOpacity style={styles.resetButton} onPress={resetWords}>
            <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, words.length === 0 && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={words.length === 0}
          >
            <LinearGradient 
              colors={words.length > 0 ? COLORS.gradientPrimary : ['#ccc', '#aaa']} 
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>Check Order</Text>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {showExplanation && submitted && (
        <View style={[styles.explanationBox, isCorrect ? styles.correctExplanation : styles.wrongExplanation]}>
          <View style={styles.explanationIcon}>
            <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={24} color={isCorrect ? COLORS.success : COLORS.error} />
          </View>
          <Text style={styles.explanationText}>
            {isCorrect ? 'Correct! ' : `Correct order: ${question.correctOrder?.join(' ')}. `}
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};

// Match Pairs Question Component
const MatchPairsQuestion: React.FC<{
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  showExplanation: boolean;
}> = ({ question, onAnswer, showExplanation }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<{ left: string; right: string }[]>([]);
  const [wrongMatch, setWrongMatch] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const leftItems = question.pairs?.map(p => p.left) || [];
  const rightItems = [...(question.pairs?.map(p => p.right) || [])].sort(() => Math.random() - 0.5);
  
  const matchedLeft = matches.map(m => m.left);
  const matchedRight = matches.map(m => m.right);
  const isCorrect = matches.length === question.pairs?.length && 
    question.pairs?.every(p => matches.some(m => m.left === p.left && m.right === p.right));

  const handleLeftSelect = (item: string) => {
    if (submitted || matchedLeft.includes(item)) return;
    setSelectedLeft(item);
    setWrongMatch(null);
  };

  const handleRightSelect = (item: string) => {
    if (submitted || !selectedLeft || matchedRight.includes(item)) return;
    
    const correctRight = question.pairs?.find(p => p.left === selectedLeft)?.right;
    
    if (correctRight === item) {
      // Correct match
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMatches([...matches, { left: selectedLeft, right: item }]);
      setSelectedLeft(null);
    } else {
      // Wrong match - show feedback
      setWrongMatch(item);
      setTimeout(() => setWrongMatch(null), 800);
      setSelectedLeft(null);
    }
  };

  useEffect(() => {
    if (matches.length === question.pairs?.length && !submitted) {
      setSubmitted(true);
      setTimeout(() => onAnswer(isCorrect), 1000);
    }
  }, [matches]);

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionLabel}>Match the pairs:</Text>
      <Text style={styles.questionText}>{question.question}</Text>
      
      <View style={styles.matchPairsContainer}>
        {/* Left column */}
        <View style={styles.matchColumn}>
          {leftItems.map((item, index) => {
            const isMatched = matchedLeft.includes(item);
            const isSelected = selectedLeft === item;
            
            return (
              <TouchableOpacity
                key={`left-${index}`}
                style={[
                  styles.matchItem,
                  isMatched && styles.matchedItem,
                  isSelected && styles.selectedMatchItem,
                ]}
                onPress={() => handleLeftSelect(item)}
                disabled={isMatched || submitted}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.matchItemText,
                  isMatched && styles.matchedItemText,
                ]}>{item}</Text>
                {isMatched && <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Connection lines visual */}
        <View style={styles.matchConnector}>
          {matches.map((match, index) => (
            <View key={index} style={styles.matchLine}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.success} />
            </View>
          ))}
        </View>

        {/* Right column */}
        <View style={styles.matchColumn}>
          {rightItems.map((item, index) => {
            const isMatched = matchedRight.includes(item);
            const isWrong = wrongMatch === item;
            
            return (
              <TouchableOpacity
                key={`right-${index}`}
                style={[
                  styles.matchItem,
                  isMatched && styles.matchedItem,
                  isWrong && styles.wrongMatchItem,
                ]}
                onPress={() => handleRightSelect(item)}
                disabled={isMatched || submitted}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.matchItemText,
                  isMatched && styles.matchedItemText,
                ]}>{item}</Text>
                {isMatched && <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showExplanation && submitted && (
        <View style={[styles.explanationBox, isCorrect ? styles.correctExplanation : styles.wrongExplanation]}>
          <View style={styles.explanationIcon}>
            <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={24} color={isCorrect ? COLORS.success : COLORS.error} />
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
};

// Listen and Answer Question Component
const ListenQuestion: React.FC<{
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  showExplanation: boolean;
}> = ({ question, onAnswer, showExplanation }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasListened, setHasListened] = useState(false);
  const isCorrect = selectedIndex === question.correctIndex;

  const handleListen = () => {
    Speech.speak(question.audioText || '', { 
      language: 'en-US', 
      rate: 0.85,
      onDone: () => setHasListened(true)
    });
    setHasListened(true);
  };

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setTimeout(() => onAnswer(isCorrect), 1200);
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionLabel}>Listen and select the correct answer:</Text>
      
      {/* Play audio button */}
      <TouchableOpacity 
        style={[styles.listenButton, hasListened && styles.listenButtonPlayed]}
        onPress={handleListen}
        activeOpacity={0.8}
      >
        <LinearGradient 
          colors={hasListened ? [COLORS.success, '#81C784'] : COLORS.gradientPrimary} 
          style={styles.listenButtonGradient}
        >
          <Ionicons name="volume-high" size={36} color={COLORS.white} />
          <Text style={styles.listenButtonText}>
            {hasListened ? 'Play Again' : 'Tap to Listen'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.optionsGrid}>
        {question.options?.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = index === question.correctIndex;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && isCorrect && styles.correctOption,
                isSelected && !isCorrect && styles.wrongOption,
                selectedIndex !== null && isCorrectOption && !isSelected && styles.revealCorrectOption,
                selectedIndex !== null && !isSelected && !isCorrectOption && styles.disabledOption,
              ]}
              onPress={() => handleSelect(index)}
              disabled={selectedIndex !== null}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.optionIndicator,
                  isSelected && isCorrect && styles.correctIndicator,
                  isSelected && !isCorrect && styles.wrongIndicator,
                ]}>
                  {isSelected ? (
                    <Ionicons 
                      name={isCorrect ? 'checkmark' : 'close'} 
                      size={16} 
                      color={COLORS.white} 
                    />
                  ) : (
                    <Text style={styles.optionIndicatorText}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {showExplanation && selectedIndex !== null && (
        <View style={[styles.explanationBox, isCorrect ? styles.correctExplanation : styles.wrongExplanation]}>
          <View style={styles.explanationIcon}>
            <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={24} color={isCorrect ? COLORS.success : COLORS.error} />
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </View>
      )}
    </View>
  );
};

// Progress Bar Component
const ProgressBar: React.FC<{ progress: number; animated?: boolean }> = ({ progress, animated = true }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 100,
        friction: 10,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View 
        style={[
          styles.progressBarFill,
          { 
            width: progressAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            })
          }
        ]}
      />
    </View>
  );
};

// Main English Lesson Player Component
export const EnglishLessonPlayer: React.FC<EnglishLessonPlayerProps> = ({
  lesson,
  onComplete,
  onExit,
}) => {
  const [phase, setPhase] = useState<'content' | 'quiz' | 'result'>('content');
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalQuestions = lesson.questions.length;
  const totalContent = lesson.content.length;
  
  const progress = phase === 'content' 
    ? ((currentContentIndex + 1) / totalContent) * 50
    : 50 + ((currentQuestionIndex + 1) / totalQuestions) * 50;

  const handleContentNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (currentContentIndex < totalContent - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else {
      setPhase('quiz');
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleContentPrev = () => {
    if (isTransitioning || currentContentIndex === 0) return;
    setIsTransitioning(true);
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentContentIndex(currentContentIndex - 1);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setShowExplanation(true);
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }
  };

  const handleNextQuestion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowExplanation(false);
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score and complete
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const xpEarned = Math.round((score / 100) * lesson.xpReward);
      onComplete(score, xpEarned);
      setPhase('result');
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'mcq':
        return (
          <MCQQuestion
            question={question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'fillBlank':
        return (
          <FillBlankQuestion
            question={question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'arrange':
        return (
          <ArrangeQuestion
            question={question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'match':
        return (
          <MatchPairsQuestion
            question={question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />
        );
      case 'listen':
        return (
          <ListenQuestion
            question={question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />
        );
      default:
        return (
          <MCQQuestion
            question={question}
            onAnswer={handleAnswer}
            showExplanation={showExplanation}
          />
        );
    }
  };

  // Result Screen
  if (phase === 'result') {
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const xpEarned = Math.round((score / 100) * lesson.xpReward);
    
    const getResultData = () => {
      if (score >= 80) {
        return {
          gradient: COLORS.gradientSuccess,
          emoji: 'trophy',
          title: 'Excellent!',
          subtitle: 'You mastered this lesson!',
          color: COLORS.success
        };
      } else if (score >= 50) {
        return {
          gradient: COLORS.gradientPrimary,
          emoji: 'star',
          title: 'Good Job!',
          subtitle: 'Keep practicing to improve!',
          color: COLORS.primary
        };
      }
      return {
        gradient: COLORS.gradientWarm,
        emoji: 'heart',
        title: 'Keep Trying!',
        subtitle: 'Practice makes perfect!',
        color: COLORS.accent
      };
    };

    const resultData = getResultData();

    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          {/* Result Card */}
          <LinearGradient
            colors={resultData.gradient}
            style={styles.resultCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.resultIconContainer}>
              <Ionicons name={resultData.emoji as any} size={80} color={COLORS.white} />
            </View>
            <Text style={styles.resultScore}>{score}%</Text>
            <Text style={styles.resultTitle}>{resultData.title}</Text>
            <Text style={styles.resultSubtitle}>{resultData.subtitle}</Text>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.resultStats}>
            <View style={[styles.statCard, { borderLeftColor: COLORS.success }]}>
              <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
              <View style={styles.statCardContent}>
                <Text style={styles.statCardValue}>{correctAnswers}</Text>
                <Text style={styles.statCardLabel}>Correct</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { borderLeftColor: COLORS.error }]}>
              <Ionicons name="close-circle" size={28} color={COLORS.error} />
              <View style={styles.statCardContent}>
                <Text style={styles.statCardValue}>{totalQuestions - correctAnswers}</Text>
                <Text style={styles.statCardLabel}>Wrong</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, { borderLeftColor: COLORS.warning }]}>
              <Ionicons name="flash" size={28} color={COLORS.warning} />
              <View style={styles.statCardContent}>
                <Text style={styles.statCardValue}>+{xpEarned}</Text>
                <Text style={styles.statCardLabel}>XP Earned</Text>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={onExit} activeOpacity={0.9}>
            <LinearGradient colors={COLORS.gradientPrimary} style={styles.continueGradient}>
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} style={styles.closeButton} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <ProgressBar progress={progress} />

        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={16} color={COLORS.warning} />
          <Text style={styles.xpText}>+{lesson.xpReward}</Text>
        </View>
      </View>

      {/* Phase Indicator */}
      <View style={styles.phaseIndicator}>
        <View style={[styles.phaseTab, phase === 'content' && styles.activePhaseTab]}>
          <Ionicons name="book" size={16} color={phase === 'content' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.phaseTabText, phase === 'content' && styles.activePhaseTabText]}>Learn</Text>
        </View>
        <View style={[styles.phaseTab, phase === 'quiz' && styles.activePhaseTab]}>
          <Ionicons name="help-circle" size={16} color={phase === 'quiz' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.phaseTabText, phase === 'quiz' && styles.activePhaseTabText]}>Quiz</Text>
        </View>
      </View>

      {/* Content Phase */}
      {phase === 'content' && (
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.contentCounter}>
            <Text style={styles.contentCounterText}>
              Step {currentContentIndex + 1} of {totalContent}
            </Text>
          </View>

          <ContentBlockCard
            block={lesson.content[currentContentIndex]}
            index={currentContentIndex}
          />

          <View style={styles.navigationButtons}>
            {currentContentIndex > 0 && (
              <TouchableOpacity style={styles.prevButton} onPress={handleContentPrev} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
                <Text style={styles.prevButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.nextButton, currentContentIndex === 0 && styles.fullWidthButton]} 
              onPress={handleContentNext}
              activeOpacity={0.9}
            >
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.nextButtonGradient}>
                <Text style={styles.nextButtonText}>
                  {currentContentIndex < totalContent - 1 ? 'Continue' : 'Start Quiz'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Quiz Phase */}
      {phase === 'quiz' && (
        <ScrollView 
          style={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>
                {currentQuestionIndex + 1}
              </Text>
            </View>
            <Text style={styles.questionTotalText}>
              of {totalQuestions} questions
            </Text>
          </View>

          {renderQuestion(lesson.questions[currentQuestionIndex])}

          {showExplanation && (
            <TouchableOpacity 
              style={styles.nextQuestionButton} 
              onPress={handleNextQuestion}
              activeOpacity={0.9}
            >
              <LinearGradient 
                colors={COLORS.gradientPrimary} 
                style={styles.nextQuestionGradient}
              >
                <Text style={styles.nextQuestionText}>
                  {currentQuestionIndex < totalQuestions - 1 ? 'Next Question' : 'See Results'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.round,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    gap: SPACING.xs,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warning,
  },
  phaseIndicator: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  phaseTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  activePhaseTab: {
    backgroundColor: COLORS.primaryBg,
  },
  phaseTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activePhaseTabText: {
    color: COLORS.primary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.huge,
  },
  contentCounter: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  contentCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  contentBlock: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    ...SHADOWS.medium,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  blockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  blockBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  blockEmoji: {
    fontSize: 28,
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  blockContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  blockContent: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  ttsButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.round,
    ...SHADOWS.small,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  pronunciation: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  examplesContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  exampleNumber: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  nextButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  fullWidthButton: {
    marginLeft: 0,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  questionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  questionTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    lineHeight: 28,
  },
  questionAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  questionAudioText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  optionsGrid: {
    gap: SPACING.md,
  },
  optionButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  correctIndicator: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  wrongIndicator: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
  },
  wrongOption: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error,
  },
  revealCorrectOption: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  explanationIcon: {
    marginTop: 2,
  },
  correctExplanation: {
    backgroundColor: '#E8F5E9',
  },
  wrongExplanation: {
    backgroundColor: '#FFEBEE',
  },
  explanationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  fillBlankContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  fillBlankText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  fillBlankInputWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  correctInputWrapper: {
    borderColor: COLORS.success,
  },
  wrongInputWrapper: {
    borderColor: COLORS.error,
  },
  fillBlankInput: {
    minWidth: 120,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  correctInput: {
    backgroundColor: '#E8F5E9',
    color: COLORS.success,
  },
  wrongInput: {
    backgroundColor: '#FFEBEE',
    color: COLORS.error,
  },
  submitButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  arrangeAnswerArea: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  correctAnswerArea: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
  },
  wrongAnswerArea: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error,
  },
  arrangeAreaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  arrangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    minHeight: 40,
  },
  arrangePlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  arrangeWordsArea: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
  },
  selectedWordChip: {
    backgroundColor: COLORS.primary,
  },
  availableWordChip: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  correctChip: {
    backgroundColor: COLORS.success,
  },
  wrongChip: {
    backgroundColor: COLORS.error,
  },
  wordChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  availableWordChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  arrangeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  matchPairsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  matchColumn: {
    flex: 1,
    gap: SPACING.sm,
  },
  matchConnector: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  matchLine: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  matchedItem: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
  },
  selectedMatchItem: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  wrongMatchItem: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error,
  },
  matchItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  matchedItemText: {
    color: COLORS.success,
  },
  listenButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  listenButtonPlayed: {
    opacity: 0.9,
  },
  listenButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.md,
  },
  listenButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  nextQuestionButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.huge,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  nextQuestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  nextQuestionText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Result styles
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  resultCard: {
    width: SCREEN_WIDTH - 60,
    paddingVertical: SPACING.huge,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.large,
  },
  resultIconContainer: {
    marginBottom: SPACING.md,
  },
  resultScore: {
    fontSize: 72,
    fontWeight: '800',
    color: COLORS.white,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  resultSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  resultStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    ...SHADOWS.small,
  },
  statCardContent: {
    flex: 1,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  continueButton: {
    width: SCREEN_WIDTH - 60,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});