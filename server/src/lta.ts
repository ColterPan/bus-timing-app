import type { RawArrivalResponse, RawBusStop } from './types';

export const LTA_BASE = 'https://datamall2.mytransport.sg/ltaodataservice';
const PAGE_SIZE = 500;
// ~5,100 stops today = 11 pages; cap protects against an endless loop if LTA misbehaves
const MAX_PAGES = 30;

export type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export interface LtaClient {
  getBusArrival(stopCode: string): Promise<RawArrivalResponse>;
  getAllBusStops(): Promise<RawBusStop[]>;
}

// Wrapped rather than passing `fetch` directly: Cloudflare Workers throws
// "Illegal invocation" when fetch is called detached from globalThis.
const defaultFetch: FetchFn = (input, init) => fetch(input, init);

export function createLtaClient(accountKey: string, fetchImpl: FetchFn = defaultFetch): LtaClient {
  if (!accountKey) {
    throw new Error('LTA_ACCOUNT_KEY is not set. Copy server/.env.example to server/.env and add your key.');
  }

  async function get<T>(path: string): Promise<T> {
    const res = await fetchImpl(`${LTA_BASE}${path}`, {
      headers: { AccountKey: accountKey, accept: 'application/json' },
    });
    if (!res.ok) throw new UpstreamError(`LTA responded ${res.status} for ${path}`, res.status);
    return (await res.json()) as T;
  }

  return {
    getBusArrival: (stopCode) =>
      get<RawArrivalResponse>(`/v3/BusArrival?BusStopCode=${encodeURIComponent(stopCode)}`),

    async getAllBusStops() {
      const pages: RawBusStop[][] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const body = await get<{ value?: RawBusStop[] }>(`/BusStops?$skip=${page * PAGE_SIZE}`);
        const value = body.value ?? [];
        pages.push(value);
        if (value.length < PAGE_SIZE) break;
      }
      return pages.flat();
    },
  };
}
