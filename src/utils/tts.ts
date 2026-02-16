/**
 * Text-to-Speech (TTS) Utility
 * Provides speech synthesis for English lessons
 */
import * as Speech from 'expo-speech';

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
}

/**
 * Speak text using device TTS
 */
export const speak = async (text: string, options: TTSOptions = {}) => {
  const {
    language = 'en',
    pitch = 1.0,
    rate = 0.9, // Slightly slower for learning
    onStart,
    onDone,
    onError,
  } = options;

  try {
    await Speech.speak(text, {
      language,
      pitch,
      rate,
      onStart,
      onDone,
      onError,
    });
  } catch (error) {
    console.error('TTS Error:', error);
    if (onError) onError(error);
  }
};

/**
 * Stop any ongoing speech
 */
export const stopSpeaking = async () => {
  try {
    await Speech.stop();
  } catch (error) {
    console.error('TTS Stop Error:', error);
  }
};

/**
 * Check if TTS is currently speaking
 */
export const isSpeaking = async (): Promise<boolean> => {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('TTS Check Error:', error);
    return false;
  }
};

/**
 * Get available TTS voices
 */
export const getAvailableVoices = async () => {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.error('TTS Voices Error:', error);
    return [];
  }
};

/**
 * Speak with English teaching settings
 */
export const speakForLearning = async (text: string, onDone?: () => void) => {
  await speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.85, // Slower for clarity
    onDone,
  });
};

/**
 * Speak pronunciation (even slower)
 */
export const speakPronunciation = async (text: string, onDone?: () => void) => {
  await speak(text, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.7, // Very slow for pronunciation practice
    onDone,
  });
};