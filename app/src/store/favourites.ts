import type { Favourite, KeyValueStorage, ServiceArrival } from '../types';

export const FAVOURITES_KEY = 'favourites:v1';

export function isFavouriteStop(favs: readonly Favourite[], stopCode: string): boolean {
  return favs.some((f) => f.stopCode === stopCode);
}

export function isPinnedService(favs: readonly Favourite[], stopCode: string, serviceNo: string): boolean {
  return favs.some((f) => f.stopCode === stopCode && f.serviceNos.includes(serviceNo));
}

/** Add the stop (showing all services) or remove it entirely. */
export function toggleStop(favs: readonly Favourite[], stopCode: string): Favourite[] {
  return isFavouriteStop(favs, stopCode)
    ? favs.filter((f) => f.stopCode !== stopCode)
    : [...favs, { stopCode, serviceNos: [] }];
}

/** Pin/unpin one service. Pinning on an un-favourited stop favourites it too. */
export function toggleService(favs: readonly Favourite[], stopCode: string, serviceNo: string): Favourite[] {
  if (!isFavouriteStop(favs, stopCode)) return [...favs, { stopCode, serviceNos: [serviceNo] }];

  return favs.map((f) => {
    if (f.stopCode !== stopCode) return f;
    const serviceNos = f.serviceNos.includes(serviceNo)
      ? f.serviceNos.filter((s) => s !== serviceNo)
      : [...f.serviceNos, serviceNo];
    return { ...f, serviceNos };
  });
}

/** Services to show on Home for a favourite: pinned ones, or all when none are pinned. */
export function visibleServices(fav: Favourite, services: readonly ServiceArrival[]): ServiceArrival[] {
  if (fav.serviceNos.length === 0) return [...services];
  return services.filter((s) => fav.serviceNos.includes(s.serviceNo));
}

function isFavourite(value: unknown): value is Favourite {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.stopCode === 'string' &&
    Array.isArray(v.serviceNos) &&
    v.serviceNos.every((s) => typeof s === 'string')
  );
}

/** Reads favourites, ignoring corrupt or unexpected data rather than crashing. */
export async function loadFavourites(storage: KeyValueStorage): Promise<Favourite[]> {
  try {
    const raw = await storage.getItem(FAVOURITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFavourite) : [];
  } catch {
    return [];
  }
}

export function saveFavourites(storage: KeyValueStorage, favs: readonly Favourite[]): Promise<void> {
  return storage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
}
