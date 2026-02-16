/**
 * Word of the Day Card Component
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface WordOfDayCardProps {
  word: string;
  meaning: string;
  partOfSpeech: string;
  pronunciation?: string;
  synonym: string;
  antonym: string;
  exampleSentence: string;
  funFact?: string;
}

export const WordOfDayCard: React.FC<WordOfDayCardProps> = ({
  word, meaning, partOfSpeech, pronunciation,
  synonym, antonym, exampleSentence, funFact,
}) => {
  return (
    <View style={[styles.card, SHADOWS.large]}>
      <LinearGradient
        colors={COLORS.gradientCool}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.badge}>WORD OF THE DAY 📖</Text>
        <Text style={styles.word}>{word}</Text>
        {pronunciation && (
          <Text style={styles.pronunciation}>/{pronunciation}/</Text>
        )}
        <View style={styles.posBadge}>
          <Text style={styles.posText}>{partOfSpeech}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.meaning}>{meaning}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.metaPill, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.metaLabel, { color: '#2E7D32' }]}>Synonym</Text>
            <Text style={[styles.metaValue, { color: '#1B5E20' }]}>{synonym}</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: '#FFEBEE' }]}>
            <Text style={[styles.metaLabel, { color: '#C62828' }]}>Antonym</Text>
            <Text style={[styles.metaValue, { color: '#B71C1C' }]}>{antonym}</Text>
          </View>
        </View>

        <View style={styles.exampleBox}>
          <Text style={styles.exampleLabel}>Example Sentence ✍️</Text>
          <Text style={styles.exampleText}>"{exampleSentence}"</Text>
        </View>

        {funFact && (
          <View style={styles.funFactBox}>
            <Text style={styles.funFactLabel}>💡 Fun Fact</Text>
            <Text style={styles.funFactText}>{funFact}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    overflow: 'hidden', marginBottom: 20,
  },
  header: { padding: 20, alignItems: 'center' },
  badge: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5, marginBottom: 8,
  },
  word: { fontSize: 36, fontWeight: 'bold', color: COLORS.white },
  pronunciation: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4,
    fontStyle: 'italic',
  },
  posBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.round,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
  },
  posText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  body: { padding: 20 },
  meaning: {
    fontSize: 16, color: COLORS.textPrimary, lineHeight: 24, marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metaPill: {
    flex: 1, padding: 12, borderRadius: RADIUS.md, alignItems: 'center',
  },
  metaLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  metaValue: { fontSize: 15, fontWeight: '700' },
  exampleBox: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md,
    padding: 14, marginBottom: 12,
  },
  exampleLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6 },
  exampleText: {
    fontSize: 14, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 20,
  },
  funFactBox: {
    backgroundColor: '#FFF8E1', borderRadius: RADIUS.md, padding: 14,
  },
  funFactLabel: { fontSize: 12, fontWeight: '700', color: '#F57F17', marginBottom: 4 },
  funFactText: { fontSize: 13, color: '#5D4037', lineHeight: 19 },
});
