import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchStops } from '../api/client';
import type { BusStop } from '../types';
import { loadStops } from './stops';

interface StopsState {
  stops: BusStop[];
  byCode: ReadonlyMap<string, BusStop>;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const StopsContext = createContext<StopsState | null>(null);

export function StopsProvider({ children }: { children: ReactNode }) {
  const [stops, setStops] = useState<BusStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStops(await loadStops({ storage: AsyncStorage, fetchStops: () => fetchStops() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bus stops.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      stops,
      byCode: new Map(stops.map((s) => [s.code, s])),
      loading,
      error,
      retry: load,
    }),
    [stops, loading, error, load],
  );

  return <StopsContext.Provider value={value}>{children}</StopsContext.Provider>;
}

export function useStops(): StopsState {
  const ctx = useContext(StopsContext);
  if (!ctx) throw new Error('useStops must be used inside <StopsProvider>');
  return ctx;
}
