import { describe, expect, it, vi } from 'vitest';
import { LTA_BASE, UpstreamError, createLtaClient } from '../src/lta';
import { makeStops, rawArrivals } from './fixtures';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createLtaClient', () => {
  it('requires an account key', () => {
    expect(() => createLtaClient('')).toThrow(/LTA_ACCOUNT_KEY/);
  });

  it('calls v3 BusArrival with the AccountKey header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(rawArrivals));
    const client = createLtaClient('secret-key', fetchMock);

    const result = await client.getBusArrival('83139');

    expect(result.BusStopCode).toBe('83139');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${LTA_BASE}/v3/BusArrival?BusStopCode=83139`);
    expect(init.headers).toEqual({ AccountKey: 'secret-key', accept: 'application/json' });
  });

  it('throws UpstreamError without leaking the key on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ fault: 'x' }, 401));
    const client = createLtaClient('secret-key', fetchMock);

    const error = await client.getBusArrival('83139').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).status).toBe(401);
    expect((error as Error).message).not.toContain('secret-key');
  });

  it('pages through BusStops 500 at a time until a short page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ value: makeStops(500, 0) }))
      .mockResolvedValueOnce(jsonResponse({ value: makeStops(500, 500) }))
      .mockResolvedValueOnce(jsonResponse({ value: makeStops(42, 1000) }));
    const client = createLtaClient('k', fetchMock);

    const stops = await client.getAllBusStops();

    expect(stops).toHaveLength(1042);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([
      `${LTA_BASE}/BusStops?$skip=0`,
      `${LTA_BASE}/BusStops?$skip=500`,
      `${LTA_BASE}/BusStops?$skip=1000`,
    ]);
  });

  it('stops paging after a safety limit', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse({ value: makeStops(500) }));
    const client = createLtaClient('k', fetchMock);

    await client.getAllBusStops();

    expect(fetchMock).toHaveBeenCalledTimes(30);
  });

  it('treats a page without a value array as the last page', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}));
    const client = createLtaClient('k', fetchMock);

    expect(await client.getAllBusStops()).toEqual([]);
  });
});
