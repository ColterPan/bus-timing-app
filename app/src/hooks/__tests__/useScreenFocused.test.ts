import { act, renderHook } from '@testing-library/react-native';
import { useScreenFocused } from '../useScreenFocused';

let mockFocusCallback: (() => (() => void) | void) | undefined;
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => (() => void) | void) => {
    mockFocusCallback = cb;
  },
}));

describe('useScreenFocused', () => {
  it('is true while focused and false after blur', async () => {
    const { result } = await renderHook(() => useScreenFocused());
    expect(result.current).toBe(false);

    let cleanup: (() => void) | void;
    await act(() => {
      cleanup = mockFocusCallback!();
    });
    expect(result.current).toBe(true);

    await act(() => cleanup!());
    expect(result.current).toBe(false);
  });
});
