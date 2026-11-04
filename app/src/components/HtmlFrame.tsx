import { useImperativeHandle, useRef, type ComponentType, type Ref } from 'react';
import { Linking, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { WebView as RNWebView, type WebViewMessageEvent } from 'react-native-webview';
import type { HtmlFrameProps } from './HtmlFrame.types';

const EXTERNAL_URL = /^https?:\/\//i;

interface BridgeWebViewHandle {
  injectJavaScript(script: string): void;
}

interface BridgeWebViewProps {
  ref?: Ref<BridgeWebViewHandle>;
  source: { html: string };
  originWhitelist: string[];
  onMessage: (event: WebViewMessageEvent) => void;
  onShouldStartLoadWithRequest: (request: { url: string }) => boolean;
  setSupportMultipleWindows: boolean;
  javaScriptEnabled: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

// react-native-webview 14 merges its iOS/Android/Windows prop types, which collapse to `never`
// under React Native 0.88's types. Narrow it to just the props used here.
const WebView = RNWebView as unknown as ComponentType<BridgeWebViewProps>;

/** Renders an HTML page in a WebView and bridges JSON messages both ways (web version: HtmlFrame.web.tsx). */
export function HtmlFrame({ html, onMessage, ref, style, testID, title }: HtmlFrameProps) {
  const webView = useRef<BridgeWebViewHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      post(command) {
        webView.current?.injectJavaScript(
          `window.onAppCommand && window.onAppCommand(${JSON.stringify(command)});true;`,
        );
      },
    }),
    [],
  );

  return (
    <WebView
      ref={webView}
      source={{ html }}
      originWhitelist={['*']}
      onMessage={(event) => onMessage?.(event.nativeEvent.data)}
      // Links (e.g. map credits) open in the browser instead of replacing the page
      onShouldStartLoadWithRequest={(request) => {
        if (!EXTERNAL_URL.test(request.url)) return true;
        Linking.openURL(request.url).catch(() => undefined);
        return false;
      }}
      setSupportMultipleWindows={false}
      javaScriptEnabled
      style={[styles.frame, style]}
      testID={testID}
      accessibilityLabel={title}
    />
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: 'transparent' },
});
