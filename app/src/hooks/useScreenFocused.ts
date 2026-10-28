import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** True while this screen is the visible one, so hidden tabs stop polling. */
export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
