import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/cache';

describe('TtlCache.getOrLoad', () => {
  it('returns cached values until the TTL expires', async () => {
    let now = 0;
    const cache = new TtlCache(() => now);
    const loader = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');

    expect(await cache.getOrLoad('k', 1000, loader)).toBe('a');
    now = 999;
    expect(await cache.getOrLoad('k', 1000, loader)).toBe('a');
    now = 1000;
    expect(await cache.getOrLoad('k', 1000, loader)).toBe('b');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight load between concurrent callers', async () => {
    const cache = new TtlCache(() => 0);
    const loader = vi.fn().mockResolvedValue('x');

    const results = await Promise.all([
      cache.getOrLoad('k', 1000, loader),
      cache.getOrLoad('k', 1000, loader),
    ]);

    expect(results).toEqual(['x', 'x']);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const cache = new TtlCache(() => 0);
    const loader = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('ok');

    await expect(cache.getOrLoad('k', 1000, loader)).rejects.toThrow('boom');
    expect(await cache.getOrLoad('k', 1000, loader)).toBe('ok');
  });

  it('evicts expired entries when it grows past maxEntries', async () => {
    let now = 0;
    const cache = new TtlCache(() => now, 2);
    await cache.getOrLoad('a', 10, async () => 1);
    await cache.getOrLoad('b', 10, async () => 2);
    now = 20;
    await cache.getOrLoad('c', 10, async () => 3);

    expect(cache.size).toBe(1);
  });
});
