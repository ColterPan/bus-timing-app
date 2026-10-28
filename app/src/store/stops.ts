import type { BusStop, CompactStop, KeyValueStorage } from '../types';

export const STOPS_KEY = 'stops:v1';
/** Bus stops rarely change; refresh the on-device copy weekly. */
export const STOPS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedStops {
  savedAt: number;
  stops: BusStop[];
}

function isCompactStop(value: unknown): value is CompactStop {
  return (
    Array.isArray(value) &&
    value.length === 5 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'string' &&
    typeof value[2] === 'string' &&
    typeof value[3] === 'number' &&
    typeof value[4] === 'number'
  );
}

/** Converts the proxy's compact tuples, dropping malformed rows. */
export function parseStops(raw: unknown): BusStop[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCompactStop).map(([code, name, road, lat, lng]) => ({ code, name, road, lat, lng }));
}

async function readCache(storage: KeyValueStorage): Promise<CachedStops | null> {
  try {
    const raw = await storage.getItem(STOPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedStops;
    return typeof parsed.savedAt === 'number' && Array.isArray(parsed.stops) && parsed.stops.length > 0
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export interface LoadStopsDeps {
  storage: KeyValueStorage;
  fetchStops: () => Promise<CompactStop[]>;
  now?: () => number;
}

/**
 * Returns the on-device stop list, downloading it when missing or older than a week.
 * If the download fails, a stale copy is still better than nothing.
 */
export async function loadStops({ storage, fetchStops, now = Date.now }: LoadStopsDeps): Promise<BusStop[]> {
  const cached = await readCache(storage);
  if (cached && now() - cached.savedAt < STOPS_MAX_AGE_MS) return cached.stops;

  try {
    const stops = parseStops(await fetchStops());
    if (stops.length === 0) throw new Error('Bus stop list was empty');
    const entry: CachedStops = { savedAt: now(), stops };
    // Persisting is best effort; the app works for this session either way
    await storage.setItem(STOPS_KEY, JSON.stringify(entry)).catch(() => undefined);
    return stops;
  } catch (error) {
    if (cached) return cached.stops;
    throw error;
  }
}
