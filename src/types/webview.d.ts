declare module 'react-native-webview' {
  import { Component } from 'react';
  import { ViewProps, StyleProp, ViewStyle } from 'react-native';

  interface WebViewSourceUri {
    uri?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }

  interface WebViewSourceHtml {
    html: string;
    baseUrl?: string;
  }

  type WebViewSource = WebViewSourceUri | WebViewSourceHtml;

  interface WebViewProps extends ViewProps {
    source: WebViewSource;
    style?: StyleProp<ViewStyle>;
    allowsFullscreenVideo?: boolean;
    allowsInlineMediaPlayback?: boolean;
    mediaPlaybackRequiresUserAction?: boolean;
    javaScriptEnabled?: boolean;
    domStorageEnabled?: boolean;
    originWhitelist?: string[];
    mixedContentMode?: 'never' | 'always' | 'compat';
    onLoadEnd?: () => void;
    onMessage?: (event: { nativeEvent: { data: string } }) => void;
    onError?: (event: { nativeEvent: { code: number; description: string } }) => void;
    injectedJavaScript?: string;
    startInLoadingState?: boolean;
    scalesPageToFit?: boolean;
    bounces?: boolean;
    scrollEnabled?: boolean;
    automaticallyAdjustContentInsets?: boolean;
    contentInset?: { top: number; left: number; bottom: number; right: number };
    onNavigationStateChange?: (navState: {
      url?: string;
      title?: string;
      loading?: boolean;
      canGoBack?: boolean;
      canGoForward?: boolean;
    }) => void;
    onShouldStartLoadWithRequest?: (request: {
      url: string;
      navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'other';
    }) => boolean;
  }

  export class WebView extends Component<WebViewProps> {}
  export default WebView;
}
