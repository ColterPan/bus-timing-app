import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Favourite } from '../types';
import { loadFavourites, saveFavourites, toggleService, toggleStop } from './favourites';

interface FavouritesState {
  favourites: Favourite[];
  ready: boolean;
  toggleStop: (stopCode: string) => void;
  toggleService: (stopCode: string, serviceNo: string) => void;
}

const FavouritesContext = createContext<FavouritesState | null>(null);

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadFavourites(AsyncStorage).then((favs) => {
      loaded.current = true;
      setFavourites(favs);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    // Don't overwrite stored favourites with the initial empty list before loading finishes
    if (!loaded.current) return;
    saveFavourites(AsyncStorage, favourites).catch(() => undefined);
  }, [favourites]);

  const onToggleStop = useCallback((stopCode: string) => setFavourites((f) => toggleStop(f, stopCode)), []);
  const onToggleService = useCallback(
    (stopCode: string, serviceNo: string) => setFavourites((f) => toggleService(f, stopCode, serviceNo)),
    [],
  );

  const value = useMemo(
    () => ({ favourites, ready, toggleStop: onToggleStop, toggleService: onToggleService }),
    [favourites, ready, onToggleStop, onToggleService],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesState {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside <FavouritesProvider>');
  return ctx;
}
