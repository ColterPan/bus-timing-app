import type { Arrivals, CompactStop } from '../types';

const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
}

/** Error with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchFn = typeof fetch;

async function getJson<T>(path: string, fetchImpl: FetchFn): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetchImpl(`${getApiUrl()}${path}`, { signal: controller.signal });
  } catch {
    throw new ApiError("Can't reach the bus server. Check your internet connection.");
  } finally {
    clearTimeout(timer);
  }

  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || body === null) {
    throw new ApiError(body?.error ?? `Something went wrong (${res.status}). Please try again.`, res.status);
  }
  return body;
}

export async function fetchArrivals(stopCode: string, fetchImpl: FetchFn = fetch): Promise<Arrivals> {
  const body = await getJson<Arrivals>(`/arrivals/${encodeURIComponent(stopCode)}`, fetchImpl);
  if (!Array.isArray(body.services)) throw new ApiError('Unexpected response from the bus server.');
  return body;
}

export async function fetchStops(fetchImpl: FetchFn = fetch): Promise<CompactStop[]> {
  const body = await getJson<{ stops: CompactStop[] }>('/stops', fetchImpl);
  if (!Array.isArray(body.stops)) throw new ApiError('Unexpected response from the bus server.');
  return body.stops;
}
