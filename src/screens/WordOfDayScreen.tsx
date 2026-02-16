/**
 * Word of the Day Screen — Expanded view
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { WordOfDayCard } from '../components/WordOfDayCard';
import { Loading } from '../components/Loading';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export default function WordOfDayScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const today = new Date().toISOString().split('T')[0];

  const convexUser = useQuery(
    api.users.getUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip'
  );

  const wordOfDay = useQuery(
    api.wordOfDay.getWordOfTheDay,
    convexUser?.group ? { group: convexUser.group, date: today } : 'skip'
  );

  const sentenceOfDay = useQuery(
    api.wordOfDay.getSentenceOfTheDay,
    convexUser?.group ? { group: convexUser.group, date: today } : 'skip'
  );

  if (!clerkUser) return <Loading message="Loading..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientCool}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Learning 📖</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', {
          weekday: 'long', month: 'short', day: 'numeric',
        })}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Word of the Day */}
        {wordOfDay ? (
          <WordOfDayCard
            word={wordOfDay.word}
            meaning={wordOfDay.meaning}
            partOfSpeech={wordOfDay.partOfSpeech}
            pronunciation={wordOfDay.pronunciation}
            synonym={wordOfDay.synonym}
            antonym={wordOfDay.antonym}
            exampleSentence={wordOfDay.exampleSentence}
            funFact={wordOfDay.funFact}
          />
        ) : (
          <View style={styles.noContent}>
            <Text style={styles.noContentEmoji}>📖</Text>
            <Text style={styles.noContentTitle}>Loading Word</Text>
            <Text style={styles.noContentText}>
              Today's word is being loaded. Pull down to refresh!
            </Text>
          </View>
        )}

        {/* Sentence Structure of the Day */}
        {sentenceOfDay && (
          <View style={[styles.sentenceCard, SHADOWS.large]}>
            <LinearGradient
              colors={COLORS.gradientWarm}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sentenceHeader}
            >
              <Text style={styles.sentenceBadge}>
                SENTENCE STRUCTURE OF THE DAY ✍️
              </Text>
              <Text style={styles.structureName}>{sentenceOfDay.structureName}</Text>
            </LinearGradient>

            <View style={styles.sentenceBody}>
              {/* Formula */}
              <View style={styles.formulaBox}>
                <Text style={styles.formulaLabel}>Formula 📐</Text>
                <Text style={styles.formulaText}>{sentenceOfDay.formula}</Text>
              </View>

              {/* Explanation */}
              <Text style={styles.explanation}>{sentenceOfDay.explanation}</Text>

              {/* Examples */}
              <Text style={styles.examplesTitle}>Examples 📝</Text>
              {sentenceOfDay.examples.map((ex: string, i: number) => (
                <View key={i} style={styles.exampleItem}>
                  <Text style={styles.exampleBullet}>{i + 1}.</Text>
                  <Text style={styles.exampleText}>{ex}</Text>
                </View>
              ))}

              {/* Practice prompt */}
              <View style={styles.practiceBox}>
                <Text style={styles.practiceLabel}>🎯 Your Turn!</Text>
                <Text style={styles.practiceText}>{sentenceOfDay.practicePrompt}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20,
  },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: COLORS.white, fontWeight: '600' },
  headerTitle: {
    fontSize: 28, fontWeight: 'bold', color: COLORS.white,
  },
  dateText: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  noContent: {
    alignItems: 'center', padding: 40,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xxl, ...SHADOWS.small,
  },
  noContentEmoji: { fontSize: 48, marginBottom: 12 },
  noContentTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  noContentText: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: 8,
  },

  // Sentence Structure
  sentenceCard: {
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.xl,
    overflow: 'hidden', marginBottom: 20,
  },
  sentenceHeader: { padding: 20, alignItems: 'center' },
  sentenceBadge: {
    fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5, marginBottom: 8,
  },
  structureName: { fontSize: 24, fontWeight: 'bold', color: COLORS.white },
  sentenceBody: { padding: 20 },
  formulaBox: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md,
    padding: 14, marginBottom: 16,
  },
  formulaLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6,
  },
  formulaText: {
    fontSize: 16, fontWeight: '700', color: COLORS.primary,
    fontFamily: 'monospace',
  },
  explanation: {
    fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10,
  },
  exampleItem: {
    flexDirection: 'row', marginBottom: 8, paddingLeft: 4,
  },
  exampleBullet: {
    fontSize: 14, fontWeight: '700', color: COLORS.primary, marginRight: 8, width: 20,
  },
  exampleText: {
    flex: 1, fontSize: 14, color: COLORS.textPrimary,
    fontStyle: 'italic', lineHeight: 20,
  },
  practiceBox: {
    backgroundColor: '#1A3D1A', borderRadius: RADIUS.md,
    padding: 14, marginTop: 12,
  },
  practiceLabel: {
    fontSize: 14, fontWeight: '700', color: '#4ADE80', marginBottom: 6,
  },
  practiceText: {
    fontSize: 14, color: '#86EFAC', lineHeight: 20,
  },
});
