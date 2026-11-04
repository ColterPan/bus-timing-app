import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLng } from '../lib/geo';

export const LOCATION_MAX_AGE_MS = 30_000;
const LAST_KNOWN_MAX_AGE_MS = 5 * 60_000;
const LOCATION_ERROR = "Couldn't get your location. Is location turned on?";

export type LocationState =
  | { status: 'locating' }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'error'; message: string }
  | { status: 'ready'; position: LatLng; fixedAt: number };

interface Options {
  /** Locate when the screen gains focus (if there's no fix yet or it's older than maxAgeMs). */
  focused: boolean;
  maxAgeMs?: number;
  now?: () => number;
}

export interface UserLocation {
  state: LocationState;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const toLatLng = (pos: Location.LocationObject): LatLng => ({ lat: pos.coords.latitude, lng: pos.coords.longitude });

/**
 * Asks for location permission and keeps the user's position fresh while the screen is visible,
 * so Nearby is up to date without restarting the app.
 */
export function useUserLocation({ focused, maxAgeMs = LOCATION_MAX_AGE_MS, now = Date.now }: Options): UserLocation {
  const [state, setState] = useState<LocationState>({ status: 'locating' });
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef(false);
  const lastFixAt = useRef<number | null>(null);
  const denied = useRef(false);
  const wasFocused = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);

    const apply = (pos: Location.LocationObject) => {
      const fixedAt = now();
      lastFixAt.current = fixedAt;
      setState({ status: 'ready', position: toLatLng(pos), fixedAt });
    };

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      denied.current = !permission.granted;
      if (!permission.granted) {
        setState({ status: 'denied', canAskAgain: permission.canAskAgain });
        return;
      }
      // Show the last known spot instantly on first load; a fresh GPS fix can take a few seconds
      if (lastFixAt.current === null) {
        const last = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
        if (last) apply(last);
      }
      apply(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    } catch {
      // A failed refresh keeps the previous position rather than blanking the screen
      setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', message: LOCATION_ERROR }));
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, [now]);

  useEffect(() => {
    const becameFocused = focused && !wasFocused.current;
    wasFocused.current = focused;
    // After a denial, wait for the user to tap "Allow" instead of re-prompting on every visit
    if (!becameFocused || denied.current) return;
    const last = lastFixAt.current;
    if (last === null || now() - last >= maxAgeMs) refresh();
  }, [focused, maxAgeMs, now, refresh]);

  return { state, refreshing, refresh };
}
