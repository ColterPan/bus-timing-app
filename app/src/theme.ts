import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeContext } from './store/ThemeContext';
import type { Load } from './types';

/** SG BUS green: the "lush green" of Singapore's public buses (sampled from bus photos). */
export const BRAND_GREEN = '#7AC70C';

const light = {
  dark: false,
  brand: BRAND_GREEN,
  background: '#F2F3F7',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  // Bus green is too pale to read on white, so light mode uses a deeper shade of the same hue (5.2:1)
  primary: '#437A08',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  star: '#F5A623',
  load: { SEA: '#1B8A3A', SDA: '#C77700', LSD: '#C62828' } as Record<Load, string>,
};

const dark: typeof light = {
  dark: true,
  brand: BRAND_GREEN,
  background: '#0B0F17',
  card: '#161B26',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#262C3A',
  primary: BRAND_GREEN,
  // White on bus green is only 2:1, so buttons use near-black text in dark mode (8.5:1)
  onPrimary: '#0B0F17',
  danger: '#FF6B6B',
  star: '#FFC24B',
  load: { SEA: '#4ADE80', SDA: '#FBBF24', LSD: '#F87171' },
};

export type Theme = typeof light;

export const palettes: Readonly<Record<'light' | 'dark', Theme>> = { light, dark };

/** The current palette: the user's choice in Settings, or the phone's setting by default. */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  const system = useColorScheme();
  const scheme = ctx?.scheme ?? (system === 'dark' ? 'dark' : 'light');
  return palettes[scheme];
}

export function loadColor(theme: Theme, load: Load | null): string {
  return load ? theme.load[load] : theme.muted;
}
