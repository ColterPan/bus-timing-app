import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { TtlCache } from './cache';
import type { LtaClient } from './lta';
import { toArrivalsDto, toCompactStops } from './transform';

const ARRIVALS_TTL_MS = 15_000;
const STOPS_TTL_MS = 24 * 60 * 60 * 1000;
const STOPS_BROWSER_MAX_AGE_S = 6 * 60 * 60;
const STOP_CODE_PATTERN = /^\d{5}$/;
const DEFAULT_RATE_LIMIT = { limit: 120, windowMs: 60_000 };

export interface AppDeps {
  lta: LtaClient;
  now?: () => number;
  clientIp?: (c: Context) => string;
  rateLimit?: { limit: number; windowMs: number };
  log?: (message: string, error: unknown) => void;
}

function createRateLimiter(now: () => number, { limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { start: number; count: number }>();

  return function isAllowed(ip: string): boolean {
    const t = now();
    const current = windows.get(ip);
    if (!current || t - current.start >= windowMs) {
      // Drop stale windows so the map can't grow forever
      for (const [key, w] of windows) if (t - w.start >= windowMs) windows.delete(key);
      windows.set(ip, { start: t, count: 1 });
      return true;
    }
    windows.set(ip, { start: current.start, count: current.count + 1 });
    return current.count + 1 <= limit;
  };
}

export function createApp({
  lta,
  now = Date.now,
  clientIp = () => 'unknown',
  rateLimit = DEFAULT_RATE_LIMIT,
  log = (message, error) => console.error(message, error),
}: AppDeps) {
  const cache = new TtlCache(now);
  const isAllowed = createRateLimiter(now, rateLimit);
  const app = new Hono();

  app.use('*', cors({ origin: '*', allowMethods: ['GET'] }));

  app.use('*', async (c, next) => {
    if (!isAllowed(clientIp(c))) return c.json({ error: 'Too many requests, slow down' }, 429);
    await next();
  });

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/arrivals/:stopCode', async (c) => {
    const stopCode = c.req.param('stopCode');
    if (!STOP_CODE_PATTERN.test(stopCode)) {
      return c.json({ error: 'Bus stop code must be 5 digits' }, 400);
    }
    try {
      // Cache the raw response, but compute ETAs fresh on every request
      const raw = await cache.getOrLoad(`arrivals:${stopCode}`, ARRIVALS_TTL_MS, () =>
        lta.getBusArrival(stopCode),
      );
      return c.json(toArrivalsDto(raw, now()));
    } catch (error) {
      log(`Bus arrival lookup failed for stop ${stopCode}`, error);
      return c.json({ error: 'Bus arrival service is unavailable, please try again' }, 502);
    }
  });

  app.get('/stops', async (c) => {
    try {
      const stops = await cache.getOrLoad('stops', STOPS_TTL_MS, async () =>
        toCompactStops(await lta.getAllBusStops()),
      );
      c.header('cache-control', `public, max-age=${STOPS_BROWSER_MAX_AGE_S}`);
      return c.json({ stops });
    } catch (error) {
      log('Bus stop list download failed', error);
      return c.json({ error: 'Bus stop list is unavailable, please try again' }, 502);
    }
  });

  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  app.onError((error, c) => {
    log('Unhandled server error', error);
    return c.json({ error: 'Internal server error' }, 500);
  });

  return app;
}
