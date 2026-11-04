import type { Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface HtmlFrameHandle {
  /** Sends a JSON command to the page's `window.onAppCommand`. */
  post(command: unknown): void;
}

export interface HtmlFrameProps {
  html: string;
  onMessage?: (raw: string) => void;
  ref?: Ref<HtmlFrameHandle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  title: string;
}
