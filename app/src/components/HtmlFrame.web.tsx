import { useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { HtmlFrameProps } from './HtmlFrame.types';

/** Web version of HtmlFrame: react-native-webview has no web support, so use a sandboxed iframe. */
export function HtmlFrame({ html, onMessage, ref, style, testID, title }: HtmlFrameProps) {
  const iframe = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      post(command) {
        iframe.current?.contentWindow?.postMessage(JSON.stringify(command), '*');
      },
    }),
    [],
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only accept messages from our own iframe
      if (event.source === iframe.current?.contentWindow && typeof event.data === 'string') onMessage?.(event.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  return (
    <View style={[styles.frame, style]} testID={testID}>
      <iframe
        ref={iframe}
        srcDoc={html}
        title={title}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
});
