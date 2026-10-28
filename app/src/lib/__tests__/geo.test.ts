import type { BusStop } from '../../types';
import { formatDistance, haversineMeters, nearestStops } from '../geo';

const stop = (code: string, lat: number, lng: number): BusStop => ({ code, name: code, road: 'R', lat, lng });

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters({ lat: 1.3, lng: 103.8 }, { lat: 1.3, lng: 103.8 })).toBe(0);
  });

  it('measures ~111 m for 0.001° of latitude', () => {
    expect(haversineMeters({ lat: 1.3, lng: 103.8 }, { lat: 1.301, lng: 103.8 })).toBeCloseTo(111.2, 0);
  });
});

describe('nearestStops', () => {
  const origin = { lat: 1.3, lng: 103.8 };
  const stops = [
    stop('far', 1.31, 103.8), // ~1.1 km
    stop('mid', 1.302, 103.8), // ~222 m
    stop('near', 1.3005, 103.8), // ~56 m
  ];

  it('returns stops within range, closest first', () => {
    const result = nearestStops(stops, origin);
    expect(result.map((r) => r.stop.code)).toEqual(['near', 'mid']);
    expect(result[0]!.distanceM).toBeCloseTo(55.6, 0);
  });

  it('respects limit and maxMeters', () => {
    expect(nearestStops(stops, origin, { limit: 1 })).toHaveLength(1);
    expect(nearestStops(stops, origin, { maxMeters: 2000 })).toHaveLength(3);
  });

  it('does not reorder the input', () => {
    nearestStops(stops, origin);
    expect(stops[0]!.code).toBe('far');
  });
});

describe('formatDistance', () => {
  it('uses metres under 1 km and km above', () => {
    expect(formatDistance(55.6)).toBe('56 m');
    expect(formatDistance(1234)).toBe('1.2 km');
  });
});
