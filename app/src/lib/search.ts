import type { BusStop } from '../types';

const DEFAULT_LIMIT = 50;
const STOP_CODE_PATTERN = /^\d{5}$/;

export function isStopCode(query: string): boolean {
  return STOP_CODE_PATTERN.test(query.trim());
}

/** Lower score = better match; null = no match. */
function score(stop: BusStop, q: string): number | null {
  const name = stop.name.toLowerCase();
  const road = stop.road.toLowerCase();
  if (stop.code === q) return 0;
  if (stop.code.startsWith(q)) return 1;
  if (name.startsWith(q)) return 2;
  if (name.split(/\s+/).some((word) => word.startsWith(q))) return 3;
  if (road.startsWith(q)) return 4;
  if (name.includes(q)) return 5;
  if (road.includes(q)) return 6;
  return null;
}

const CODE_MATCH_MAX_SCORE = 1;

/** Code matches read best in code order; text matches in alphabetical order. */
function tieBreak(a: BusStop, b: BusStop, score: number): number {
  return score <= CODE_MATCH_MAX_SCORE ? a.code.localeCompare(b.code) : a.name.localeCompare(b.name);
}

/** Case-insensitive search across stop code, description and road name. */
export function searchStops(stops: readonly BusStop[], query: string, limit = DEFAULT_LIMIT): BusStop[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return stops
    .map((stop) => ({ stop, s: score(stop, q) }))
    .filter((m): m is { stop: BusStop; s: number } => m.s !== null)
    .sort((a, b) => a.s - b.s || tieBreak(a.stop, b.stop, a.s))
    .slice(0, limit)
    .map((m) => m.stop);
}
