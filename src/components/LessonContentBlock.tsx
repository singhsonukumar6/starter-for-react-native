/**
 * Lesson Content Block Component - Vertical feed style
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { CodePlayground } from './CodePlayground';
import { VideoPlayer } from './VideoPlayer';

interface ContentBlock {
  type: string; // "text" | "example" | "tip" | "highlight" | "code" | "playground" | "video"
  title: string;
  content: string;
  emoji?: string;
  language?: 'html' | 'javascript' | 'python' | 'react' | 'c' | 'cpp' | 'java' | 'go';
  expectedOutput?: string;
}

interface LessonContentBlockProps {
  block: ContentBlock;
  blockIndex: number;
  onPlaygroundStatusChange?: (isComplete: boolean) => void;
  // Deprecated but kept for backward compat if needed temporarily
  onPlaygroundComplete?: () => void;
}

const TYPE_CONFIG: Record<string, {
  colors: readonly [string, string, ...string[]];
  bg: string;
  icon: string;
  label: string;
}> = {
  text: {
    colors: COLORS.gradientPrimary,
    bg: COLORS.primaryBg,
    icon: '📝',
    label: 'LEARN',
  },
  example: {
    colors: COLORS.gradientCool,
    bg: '#E3F2FD',
    icon: '💡',
    label: 'EXAMPLE',
  },
  tip: {
    colors: COLORS.gradientSuccess,
    bg: '#E8F5E9',
    icon: '⭐',
    label: 'PRO TIP',
  },
  highlight: {
    colors: COLORS.gradientWarm,
    bg: '#FFF3E0',
    icon: '🔥',
    label: 'KEY POINT',
  },
  code: {
    colors: ['#333', '#111'],
    bg: '#F5F5F5',
    icon: '💻',
    label: 'CODE SNIPPET',
  },
  playground: {
    colors: ['#9C27B0', '#673AB7'],
    bg: '#F3E5F5',
    icon: '🚀',
    label: 'CODE CHALLENGE',
  },
  video: {
    colors: ['#E91E63', '#9C27B0'],
    bg: '#FCE4EC',
    icon: '🎬',
    label: 'VIDEO',
  }
};

// Helper to detect if content is a video URL
const isVideoUrl = (content: string): boolean => {
  if (!content) return false;
  const lowerContent = content.toLowerCase().trim();
  return (
    lowerContent.includes('youtube.com') ||
    lowerContent.includes('youtu.be') ||
    lowerContent.includes('vimeo.com') ||
    lowerContent.includes('.mp4') ||
    lowerContent.includes('.webm') ||
    lowerContent.includes('.mov') ||
    lowerContent.includes('.m3u8') ||
    lowerContent.includes('.mkv')
  );
};

export const LessonContentBlock: React.FC<LessonContentBlockProps> = ({
  block,
  onPlaygroundComplete,
  onPlaygroundStatusChange,
}) => {
  // Normalize block type (handle case variations)
  const blockType = (block.type || 'text').toLowerCase().trim();
  const config = TYPE_CONFIG[blockType] || TYPE_CONFIG.text;
  
  // Auto-detect video if type is video OR if content looks like a video URL
  const isVideo = blockType === 'video' || isVideoUrl(block.content);

  // Video Block
  if (isVideo) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <LinearGradient
            colors={TYPE_CONFIG.video.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
          >
            <Text style={styles.badgeIcon}>{TYPE_CONFIG.video.icon}</Text>
            <Text style={styles.badgeText}>{TYPE_CONFIG.video.label}</Text>
          </LinearGradient>
          {block.title ? <Text style={styles.blockTitle}>{block.title}</Text> : null}
        </View>
        <VideoPlayer 
          url={block.content} 
          title={block.emoji ? `${block.emoji} ${block.title}` : undefined}
        />
      </View>
    );
  }

  if (blockType === 'playground') {
      return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <LinearGradient
                    colors={config.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.badge}
                >
                    <Text style={styles.badgeIcon}>{config.icon}</Text>
                    <Text style={styles.badgeText}>{config.label}</Text>
                </LinearGradient>
                {block.title ? <Text style={styles.blockTitle}>{block.title}</Text> : null}
            </View>
            
            <CodePlayground 
                initialCode={block.content}
                expectedOutput={block.expectedOutput}
                language={(block.language as any) || 'html'}
                height={400}
                taskTitle={block.title}
                onValidationChange={(isValid) => {
                    onPlaygroundStatusChange && onPlaygroundStatusChange(isValid);
                    if (isValid && onPlaygroundComplete) onPlaygroundComplete();
                }}
            />
        </View>
      );
  }

  return (
    <View style={styles.container}>
      {/* Type badge */}
      <View style={styles.headerRow}>
        <LinearGradient
            colors={config.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}
        >
            <Text style={styles.badgeIcon}>{config.icon}</Text>
            <Text style={styles.badgeText}>{config.label}</Text>
        </LinearGradient>
        {block.title ? <Text style={styles.blockTitle}>{block.title}</Text> : null}
      </View>

      {/* Content card */}
      <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.colors[0] }]}>
        <View style={styles.contentRow}>
            {block.emoji && (
                <Text style={styles.emoji}>{block.emoji}</Text>
            )}
            <Text style={[
              styles.content, 
              block.type === 'code' && styles.codeContent
            ]}>
              {block.content}
            </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginBottom: 24, 
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  card: {
    width: '100%', borderRadius: RADIUS.lg, padding: 16,
    ...SHADOWS.small,
    borderLeftWidth: 4, 
  },
  contentRow: {
    flexDirection: 'column', 
  },
  emoji: { fontSize: 32, marginBottom: 8 },
  content: {
    fontSize: 16, color: COLORS.textSecondary, 
    lineHeight: 24,
  },
  codeContent: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#333',
  },
});
