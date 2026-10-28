import type { CompactStop, KeyValueStorage } from '../../types';
import { STOPS_KEY, STOPS_MAX_AGE_MS, loadStops, parseStops } from '../stops';

const compact: CompactStop[] = [
  ['83139', 'Blk 89', 'Joo Chiat Rd', 1.31, 103.9],
  ['01012', 'Hotel Grand Pacific', 'Victoria St', 1.29, 103.85],
];
const parsed = [
  { code: '83139', name: 'Blk 89', road: 'Joo Chiat Rd', lat: 1.31, lng: 103.9 },
  { code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St', lat: 1.29, lng: 103.85 },
];

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  const storage: KeyValueStorage = {
    getItem: async (k) => data[k] ?? null,
    setItem: async (k, v) => {
      data[k] = v;
    },
  };
  return { storage, data };
}

describe('parseStops', () => {
  it('converts tuples and drops malformed rows', () => {
    expect(parseStops([...compact, ['x'], null, ['1', 'a', 'b', 'lat', 2]])).toEqual(parsed);
  });

  it('returns [] for non-arrays', () => {
    expect(parseStops({})).toEqual([]);
  });
});

describe('loadStops', () => {
  const NOW = 1_000_000_000_000;

  it('downloads and caches when nothing is stored', async () => {
    const { storage, data } = memoryStorage();
    const fetchStops = jest.fn().mockResolvedValue(compact);

    expect(await loadStops({ storage, fetchStops, now: () => NOW })).toEqual(parsed);
    expect(JSON.parse(data[STOPS_KEY]!)).toEqual({ savedAt: NOW, stops: parsed });
  });

  it('uses a fresh cache without downloading', async () => {
    const { storage } = memoryStorage({ [STOPS_KEY]: JSON.stringify({ savedAt: NOW - 1000, stops: parsed }) });
    const fetchStops = jest.fn();

    expect(await loadStops({ storage, fetchStops, now: () => NOW })).toEqual(parsed);
    expect(fetchStops).not.toHaveBeenCalled();
  });

  it('refreshes a cache older than a week', async () => {
    const old = [{ ...parsed[0]!, name: 'Old name' }];
    const { storage } = memoryStorage({
      [STOPS_KEY]: JSON.stringify({ savedAt: NOW - STOPS_MAX_AGE_MS, stops: old }),
    });
    const fetchStops = jest.fn().mockResolvedValue(compact);

    expect(await loadStops({ storage, fetchStops, now: () => NOW })).toEqual(parsed);
  });

  it('falls back to a stale cache when the download fails', async () => {
    const { storage } = memoryStorage({ [STOPS_KEY]: JSON.stringify({ savedAt: 0, stops: parsed }) });
    const fetchStops = jest.fn().mockRejectedValue(new Error('offline'));

    expect(await loadStops({ storage, fetchStops, now: () => NOW })).toEqual(parsed);
  });

  it('throws when the download fails and there is no cache', async () => {
    const { storage } = memoryStorage({ [STOPS_KEY]: 'garbage' });
    const fetchStops = jest.fn().mockRejectedValue(new Error('offline'));

    await expect(loadStops({ storage, fetchStops, now: () => NOW })).rejects.toThrow('offline');
  });

  it('treats an empty download as a failure', async () => {
    const { storage } = memoryStorage();
    const fetchStops = jest.fn().mockResolvedValue([]);

    await expect(loadStops({ storage, fetchStops })).rejects.toThrow('empty');
  });

  it('still returns stops when saving the cache fails', async () => {
    const storage: KeyValueStorage = {
      getItem: async () => null,
      setItem: () => Promise.reject(new Error('quota')),
    };
    const fetchStops = jest.fn().mockResolvedValue(compact);

    expect(await loadStops({ storage, fetchStops })).toEqual(parsed);
  });
});
