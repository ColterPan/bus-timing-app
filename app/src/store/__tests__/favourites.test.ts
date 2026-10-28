import type { Favourite, KeyValueStorage, ServiceArrival } from '../../types';
import {
  FAVOURITES_KEY,
  isFavouriteStop,
  isPinnedService,
  loadFavourites,
  saveFavourites,
  toggleService,
  toggleStop,
  visibleServices,
} from '../favourites';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => data[k] ?? null,
    setItem: async (k, v) => {
      data[k] = v;
    },
  };
}

describe('toggleStop', () => {
  it('adds then removes a stop without mutating the input', () => {
    const empty: Favourite[] = [];
    const added = toggleStop(empty, '83139');
    expect(added).toEqual([{ stopCode: '83139', serviceNos: [] }]);
    expect(empty).toEqual([]);
    expect(toggleStop(added, '83139')).toEqual([]);
  });
});

describe('toggleService', () => {
  it('favourites the stop with that service pinned', () => {
    expect(toggleService([], '83139', '15')).toEqual([{ stopCode: '83139', serviceNos: ['15'] }]);
  });

  it('pins and unpins services on an existing favourite', () => {
    const favs: Favourite[] = [
      { stopCode: '83139', serviceNos: ['15'] },
      { stopCode: '01012', serviceNos: [] },
    ];
    const pinned = toggleService(favs, '83139', '155');
    expect(pinned[0]!.serviceNos).toEqual(['15', '155']);
    expect(pinned[1]).toBe(favs[1]);
    expect(favs[0]!.serviceNos).toEqual(['15']);

    expect(toggleService(pinned, '83139', '15')[0]!.serviceNos).toEqual(['155']);
  });
});

describe('queries', () => {
  const favs: Favourite[] = [{ stopCode: '83139', serviceNos: ['15'] }];

  it('reports favourite stops and pinned services', () => {
    expect(isFavouriteStop(favs, '83139')).toBe(true);
    expect(isFavouriteStop(favs, '00000')).toBe(false);
    expect(isPinnedService(favs, '83139', '15')).toBe(true);
    expect(isPinnedService(favs, '83139', '155')).toBe(false);
  });

  it('shows pinned services only, or all when none pinned', () => {
    const services = [{ serviceNo: '15' }, { serviceNo: '155' }] as ServiceArrival[];
    expect(visibleServices(favs[0]!, services).map((s) => s.serviceNo)).toEqual(['15']);
    expect(visibleServices({ stopCode: 'x', serviceNos: [] }, services)).toHaveLength(2);
  });
});

describe('persistence', () => {
  it('round-trips through storage', async () => {
    const storage = memoryStorage();
    const favs: Favourite[] = [{ stopCode: '83139', serviceNos: ['15'] }];
    await saveFavourites(storage, favs);
    expect(await loadFavourites(storage)).toEqual(favs);
  });

  it('returns [] when nothing is stored', async () => {
    expect(await loadFavourites(memoryStorage())).toEqual([]);
  });

  it('ignores corrupt JSON and malformed entries', async () => {
    expect(await loadFavourites(memoryStorage({ [FAVOURITES_KEY]: '{not json' }))).toEqual([]);
    expect(await loadFavourites(memoryStorage({ [FAVOURITES_KEY]: '{"a":1}' }))).toEqual([]);
    const mixed = JSON.stringify([{ stopCode: '1', serviceNos: [] }, { stopCode: 2 }, null, { stopCode: '3', serviceNos: [4] }]);
    expect(await loadFavourites(memoryStorage({ [FAVOURITES_KEY]: mixed }))).toEqual([{ stopCode: '1', serviceNos: [] }]);
  });

  it('returns [] when storage throws', async () => {
    const broken: KeyValueStorage = {
      getItem: () => Promise.reject(new Error('disk')),
      setItem: () => Promise.resolve(),
    };
    expect(await loadFavourites(broken)).toEqual([]);
  });
});
