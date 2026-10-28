import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { UpstreamError, type LtaClient } from '../src/lta';
import { NOW, makeStops, rawArrivals } from './fixtures';

function fakeLta(overrides: Partial<LtaClient> = {}): LtaClient {
  return {
    getBusArrival: vi.fn().mockResolvedValue(rawArrivals),
    getAllBusStops: vi.fn().mockResolvedValue(makeStops(3)),
    ...overrides,
  };
}

function build(lta = fakeLta(), rateLimit = { limit: 100, windowMs: 60_000 }) {
  let now = NOW;
  const app = createApp({
    lta,
    now: () => now,
    clientIp: (c) => c.req.header('x-test-ip') ?? 'test',
    rateLimit,
    log: () => {},
  });
  return { app, lta, advance: (ms: number) => (now += ms) };
}

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await build().app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('GET /arrivals/:stopCode', () => {
  it('returns transformed arrivals', async () => {
    const res = await build().app.request('/arrivals/83139');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stopCode).toBe('83139');
    expect(body.services[0].serviceNo).toBe('2A');
  });

  it('allows any origin (for browser testing)', async () => {
    const res = await build().app.request('/arrivals/83139', {
      headers: { origin: 'http://localhost:8081' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it.each(['1234', '123456', 'abcde', '8313x'])('rejects invalid stop code %s with 400', async (code) => {
    const { app, lta } = build();
    const res = await app.request(`/arrivals/${code}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Bus stop code must be 5 digits' });
    expect(lta.getBusArrival).not.toHaveBeenCalled();
  });

  it('caches arrivals per stop for 15 seconds', async () => {
    const { app, lta, advance } = build();
    await app.request('/arrivals/83139');
    advance(14_000);
    await app.request('/arrivals/83139');
    expect(lta.getBusArrival).toHaveBeenCalledTimes(1);
    advance(1_000);
    await app.request('/arrivals/83139');
    expect(lta.getBusArrival).toHaveBeenCalledTimes(2);
  });

  it('recomputes ETAs from the cached raw data as time passes', async () => {
    const { app, advance } = build();
    await app.request('/arrivals/83139');
    advance(10_000);
    const body = await (await app.request('/arrivals/83139')).json();
    expect(body.fetchedAt).toBe(new Date(NOW + 10_000).toISOString());
  });

  it('returns 502 with a generic message when LTA fails', async () => {
    const lta = fakeLta({
      getBusArrival: vi.fn().mockRejectedValue(new UpstreamError('LTA responded 500', 500)),
    });
    const res = await build(lta).app.request('/arrivals/83139');
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Bus arrival service is unavailable, please try again' });
  });
});

describe('GET /stops', () => {
  it('returns compact stops with a long cache header', async () => {
    const res = await build().app.request('/stops');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('max-age=');
    const body = await res.json();
    expect(body.stops).toHaveLength(3);
    expect(body.stops[0]).toEqual(['10000', 'Stop 0', 'Road 0', 1.3, 103.8]);
  });

  it('only loads stops from LTA once per day', async () => {
    const { app, lta, advance } = build();
    await app.request('/stops');
    advance(23 * 60 * 60 * 1000);
    await app.request('/stops');
    expect(lta.getAllBusStops).toHaveBeenCalledTimes(1);
  });
});

describe('rate limiting', () => {
  it('returns 429 after the per-IP limit, per window', async () => {
    const { app, advance } = build(fakeLta(), { limit: 2, windowMs: 60_000 });
    const hit = (ip: string) => app.request('/health', { headers: { 'x-test-ip': ip } });

    expect((await hit('1.1.1.1')).status).toBe(200);
    expect((await hit('1.1.1.1')).status).toBe(200);
    const limited = await hit('1.1.1.1');
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: 'Too many requests, slow down' });
    expect((await hit('2.2.2.2')).status).toBe(200);

    advance(60_000);
    expect((await hit('1.1.1.1')).status).toBe(200);
  });
});

describe('unknown routes', () => {
  it('returns 404 in the error envelope', async () => {
    const res = await build().app.request('/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});
