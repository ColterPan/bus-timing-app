import type { BusStop } from '../types';

const EARTH_RADIUS_M = 6_371_000;
const DEFAULT_LIMIT = 10;
const DEFAULT_MAX_METERS = 500;
const METERS_PER_KM = 1_000;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NearbyStop {
  stop: BusStop;
  distanceM: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function nearestStops(
  stops: readonly BusStop[],
  origin: LatLng,
  { limit = DEFAULT_LIMIT, maxMeters = DEFAULT_MAX_METERS } = {},
): NearbyStop[] {
  return stops
    .map((stop) => ({ stop, distanceM: haversineMeters(origin, stop) }))
    .filter((s) => s.distanceM <= maxMeters)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

export function formatDistance(meters: number): string {
  if (meters < METERS_PER_KM) return `${Math.round(meters)} m`;
  return `${(meters / METERS_PER_KM).toFixed(1)} km`;
}
