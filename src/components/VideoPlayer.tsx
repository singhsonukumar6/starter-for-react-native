/**
 * Video Player Component
 * Supports YouTube, Vimeo, MP4, HLS, and other video formats
 * - YouTube: Uses react-native-youtube-iframe (proper YouTube embed support)
 * - Vimeo: Uses iframe embed in WebView
 * - Native video files: Uses expo-av Video component
 */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH - 40) * (9 / 16); // 16:9 aspect ratio

interface VideoPlayerProps {
  url: string;
  title?: string;
  autoPlay?: boolean;
}

// Loading component
const VideoLoading: React.FC = () => (
  <View style={styles.overlay}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Loading video...</Text>
  </View>
);

// Error component
const VideoError: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <View style={styles.overlay}>
    <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Tap to Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Detect video type from URL
const getVideoType = (url: string): 'youtube' | 'vimeo' | 'native' => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  return 'native';
};

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Extract Vimeo video ID from URL
const getVimeoVideoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

// YouTube Player Component - Using react-native-youtube-iframe
const YouTubePlayer: React.FC<{
  videoId: string;
  onReady: () => void;
  onError: () => void;
}> = ({ videoId, onReady, onError }) => {
  return (
    <YoutubeIframe
      height={VIDEO_HEIGHT}
      videoId={videoId}
      play={false}
      onReady={onReady}
      onError={onError}
      webViewStyle={styles.webView}
      webViewProps={{
        allowsFullscreenVideo: true,
        allowsInlineMediaPlayback: true,
      }}
    />
  );
};

// Vimeo Player Component
const VimeoPlayer: React.FC<{
  videoId: string;
  onReady: () => void;
  onError: () => void;
}> = ({ videoId, onReady, onError }) => {
  const embedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      background: #000; 
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .video-container {
      position: relative;
      width: 100%;
      height: 100%;
      padding: 56.25% 0 0 0;
    }
    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <iframe 
      src="https://player.vimeo.com/video/${videoId}?playsinline=1"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      playsinline
    ></iframe>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.ReactNativeWebView.postMessage('ready');
      }, 500);
    };
  </script>
</body>
</html>
`;

  return (
    <WebView
      source={{ html: embedHtml }}
      style={styles.webView}
      allowsFullscreenVideo={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      onMessage={(event) => {
        if (event.nativeEvent.data === 'ready') {
          onReady();
        }
      }}
      onError={onError}
      onLoadEnd={() => {
        setTimeout(onReady, 1000);
      }}
    />
  );
};

// Native Video Player Component (for MP4, HLS, etc.)
const NativeVideoPlayer: React.FC<{
  url: string;
  onReady: () => void;
  onError: () => void;
}> = ({ url, onReady, onError }) => {
  const videoRef = useRef<Video>(null);

  return (
    <Video
      ref={videoRef}
      source={{ uri: url }}
      style={styles.video}
      resizeMode={ResizeMode.CONTAIN}
      useNativeControls
      onPlaybackStatusUpdate={(status) => {
        if (status.isLoaded) {
          onReady();
        }
      }}
      onError={(error) => {
        console.error('Video error:', error);
        onError();
      }}
      onLoad={onReady}
    />
  );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  title,
  autoPlay = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // If no URL, show error
  if (!url) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.videoWrapper}>
          <VideoError message="No video URL provided" />
        </View>
      </View>
    );
  }

  const videoType = getVideoType(url);
  
  const handleReady = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setError('Failed to load video. Please check the URL.');
    setIsLoading(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryKey(prev => prev + 1);
  };

  const renderPlayer = () => {
    if (error) {
      return <VideoError message={error} onRetry={handleRetry} />;
    }

    switch (videoType) {
      case 'youtube': {
        const videoId = getYouTubeVideoId(url);
        if (!videoId) {
          return <VideoError message="Invalid YouTube URL" onRetry={handleRetry} />;
        }
        return (
          <YouTubePlayer
            key={retryKey}
            videoId={videoId}
            onReady={handleReady}
            onError={handleError}
          />
        );
      }
      case 'vimeo': {
        const videoId = getVimeoVideoId(url);
        if (!videoId) {
          return <VideoError message="Invalid Vimeo URL" onRetry={handleRetry} />;
        }
        return (
          <VimeoPlayer
            key={retryKey}
            videoId={videoId}
            onReady={handleReady}
            onError={handleError}
          />
        );
      }
      case 'native':
      default:
        return (
          <NativeVideoPlayer
            key={retryKey}
            url={url}
            onReady={handleReady}
            onError={handleError}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.videoWrapper}>
        {isLoading && !error && videoType !== 'youtube' && <VideoLoading />}
        {renderPlayer()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  videoWrapper: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
