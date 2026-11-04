import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useUserLocation } from '../useUserLocation';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const mocked = Location as jest.Mocked<typeof Location>;
const fix = (lat: number, lng: number) => ({ coords: { latitude: lat, longitude: lng } }) as Location.LocationObject;
const granted = { granted: true, canAskAgain: true } as Location.LocationPermissionResponse;

beforeEach(() => {
  jest.clearAllMocks();
  mocked.requestForegroundPermissionsAsync.mockResolvedValue(granted);
  mocked.getLastKnownPositionAsync.mockResolvedValue(null);
  mocked.getCurrentPositionAsync.mockResolvedValue(fix(1.3129, 103.9019));
});

describe('useUserLocation', () => {
  it('locates when the screen is focused', async () => {
    const { result } = await renderHook(() => useUserLocation({ focused: true }));

    expect(result.current.state).toEqual({
      status: 'ready',
      position: { lat: 1.3129, lng: 103.9019 },
      fixedAt: expect.any(Number),
    });
  });

  it('does nothing until focused', async () => {
    const { result } = await renderHook(() => useUserLocation({ focused: false }));

    expect(result.current.state.status).toBe('locating');
    expect(mocked.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('shows the last known position first, then the fresh one', async () => {
    mocked.getLastKnownPositionAsync.mockResolvedValue(fix(1.3, 103.8));
    let resolveCurrent!: (v: Location.LocationObject) => void;
    mocked.getCurrentPositionAsync.mockImplementation(() => new Promise((r) => (resolveCurrent = r)));
    const { result } = await renderHook(() => useUserLocation({ focused: true }));

    expect(result.current.state).toMatchObject({ status: 'ready', position: { lat: 1.3, lng: 103.8 } });
    expect(result.current.refreshing).toBe(true);

    await act(async () => resolveCurrent(fix(1.31, 103.9)));
    expect(result.current.state).toMatchObject({ position: { lat: 1.31, lng: 103.9 } });
    expect(result.current.refreshing).toBe(false);
  });

  it('reports a denied permission and whether it can be asked again', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Location.LocationPermissionResponse);
    const { result } = await renderHook(() => useUserLocation({ focused: true }));

    expect(result.current.state).toEqual({ status: 'denied', canAskAgain: false });
    expect(mocked.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('reports location errors', async () => {
    mocked.getCurrentPositionAsync.mockRejectedValue(new Error('Location services are off'));
    const { result } = await renderHook(() => useUserLocation({ focused: true }));

    expect(result.current.state).toEqual({
      status: 'error',
      message: "Couldn't get your location. Is location turned on?",
    });
  });

  it('keeps the old position if a refresh fails', async () => {
    const { result } = await renderHook(() => useUserLocation({ focused: true }));
    mocked.getCurrentPositionAsync.mockRejectedValueOnce(new Error('timeout'));

    await act(() => result.current.refresh());

    expect(result.current.state).toMatchObject({ status: 'ready', position: { lat: 1.3129, lng: 103.9019 } });
  });

  it('re-locates on refocus only when the fix is stale', async () => {
    let now = 1_000_000;
    const { rerender } = await renderHook((props: { focused: boolean }) =>
      useUserLocation({ focused: props.focused, maxAgeMs: 30_000, now: () => now }),
      { initialProps: { focused: true } },
    );
    expect(mocked.getCurrentPositionAsync).toHaveBeenCalledTimes(1);

    await rerender({ focused: false });
    now += 10_000;
    await rerender({ focused: true });
    expect(mocked.getCurrentPositionAsync).toHaveBeenCalledTimes(1); // still fresh

    await rerender({ focused: false });
    now += 30_000;
    await rerender({ focused: true });
    expect(mocked.getCurrentPositionAsync).toHaveBeenCalledTimes(2);
  });

  it('does not keep re-asking after a denial', async () => {
    mocked.requestForegroundPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as Location.LocationPermissionResponse);
    const { rerender } = await renderHook((props: { focused: boolean }) => useUserLocation({ focused: props.focused }), {
      initialProps: { focused: true },
    });
    await rerender({ focused: false });
    await rerender({ focused: true });

    expect(mocked.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});
