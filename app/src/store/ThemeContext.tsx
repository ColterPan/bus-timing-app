import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export const THEME_KEY = 'theme:v1';
const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

interface ThemeState {
  preference: ThemePreference;
  /** The scheme actually in use after resolving "system". */
  scheme: ColorScheme;
  setPreference: (preference: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);

/** Tells native UI (keyboard, dialogs, WebViews) about the choice; web has no override API. */
function applyNativeScheme(preference: ThemePreference): void {
  if (typeof Appearance.setColorScheme !== 'function') return;
  try {
    Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
  } catch {
    // Best effort only: the app's own colours come from this context either way
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Injected in tests; defaults to the native Appearance override. */
  applyScheme?: (preference: ThemePreference) => void;
}

export function ThemeProvider({ children, applyScheme = applyNativeScheme }: ThemeProviderProps) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (PREFERENCES.includes(saved as ThemePreference)) setPreferenceState(saved as ThemePreference);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    applyScheme(preference);
  }, [preference, applyScheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
  }, []);

  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used inside <ThemeProvider>');
  return ctx;
}
