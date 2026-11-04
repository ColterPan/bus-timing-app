import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useTheme } from '../../theme';
import { THEME_KEY, ThemeProvider, useThemePreference } from '../ThemeContext';

const applyScheme = jest.fn();
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider applyScheme={applyScheme}>{children}</ThemeProvider>
);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('ThemeProvider', () => {
  it('follows the system by default', async () => {
    const { result } = await renderHook(() => useThemePreference(), { wrapper });

    expect(result.current.preference).toBe('system');
    expect(result.current.scheme).toBe('light'); // Jest's default system appearance
    expect(applyScheme).toHaveBeenLastCalledWith('system');
  });

  it('restores the saved choice', async () => {
    await AsyncStorage.setItem(THEME_KEY, 'dark');
    const { result } = await renderHook(() => useThemePreference(), { wrapper });

    await waitFor(() => expect(result.current.preference).toBe('dark'));
    expect(result.current.scheme).toBe('dark');
    expect(applyScheme).toHaveBeenLastCalledWith('dark');
  });

  it('ignores a corrupt saved value', async () => {
    await AsyncStorage.setItem(THEME_KEY, 'purple');
    const { result } = await renderHook(() => useThemePreference(), { wrapper });

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith(THEME_KEY));
    expect(result.current.preference).toBe('system');
  });

  it('saves and applies a new choice', async () => {
    const { result } = await renderHook(() => useThemePreference(), { wrapper });

    await act(() => result.current.setPreference('dark'));

    expect(result.current.scheme).toBe('dark');
    expect(applyScheme).toHaveBeenLastCalledWith('dark');
    expect(await AsyncStorage.getItem(THEME_KEY)).toBe('dark');

    await act(() => result.current.setPreference('light'));
    expect(result.current.scheme).toBe('light');
  });

  it('useTheme returns the matching palette', async () => {
    const { result } = await renderHook(() => ({ theme: useTheme(), pref: useThemePreference() }), { wrapper });
    expect(result.current.theme.dark).toBe(false);

    await act(() => result.current.pref.setPreference('dark'));

    expect(result.current.theme.dark).toBe(true);
    expect(result.current.theme.background).toBe('#0B0F17');
  });

  it('throws a helpful error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useThemePreference())).rejects.toThrow(/ThemeProvider/);
  });
});

describe('useTheme without a provider', () => {
  it('falls back to the system appearance', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.dark).toBe(false);
  });
});
