import { useColorScheme } from 'react-native';
import type { Load } from './types';

const light = {
  background: '#F2F3F7',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#1E6FD9',
  danger: '#C62828',
  star: '#F5A623',
  load: { SEA: '#1B8A3A', SDA: '#C77700', LSD: '#C62828' } as Record<Load, string>,
};

const dark: typeof light = {
  background: '#0B0F17',
  card: '#161B26',
  text: '#F3F4F6',
  muted: '#9CA3AF',
  border: '#262C3A',
  primary: '#5EA0FF',
  danger: '#FF6B6B',
  star: '#FFC24B',
  load: { SEA: '#4ADE80', SDA: '#FBBF24', LSD: '#F87171' },
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export function loadColor(theme: Theme, load: Load | null): string {
  return load ? theme.load[load] : theme.muted;
}
