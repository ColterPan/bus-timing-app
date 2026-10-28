import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchArrivals } from '../api/client';
import type { Arrivals } from '../types';

export const REFRESH_INTERVAL_MS = 20_000;

interface Options {
  /** Poll only while true (e.g. while the screen is focused). */
  active: boolean;
  intervalMs?: number;
  fetcher?: (stopCode: string) => Promise<Arrivals>;
}

export interface ArrivalsState {
  data: Arrivals | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Fetches arrivals for a stop and re-polls every 20s while active.
 * On a failed refresh the last good data is kept alongside the error.
 */
export function useArrivals(
  stopCode: string,
  { active, intervalMs = REFRESH_INTERVAL_MS, fetcher = fetchArrivals }: Options,
): ArrivalsState {
  const [data, setData] = useState<Arrivals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Guards against stale responses landing after the stop changed or the screen unmounted
  const requestId = useRef(0);

  const load = useCallback(
    async (manual: boolean) => {
      const id = ++requestId.current;
      if (manual) setRefreshing(true);
      try {
        const result = await fetcher(stopCode);
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(e instanceof Error ? e.message : 'Could not load bus arrivals.');
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [stopCode, fetcher],
  );

  useEffect(() => {
    setData(null);
    setLoading(true);
  }, [stopCode]);

  useEffect(() => {
    if (!active) return;
    load(false);
    const timer = setInterval(() => load(false), intervalMs);
    return () => {
      clearInterval(timer);
      requestId.current++;
    };
  }, [active, intervalMs, load]);

  const refresh = useCallback(() => {
    load(true);
  }, [load]);

  return { data, error, loading, refreshing, refresh };
}
