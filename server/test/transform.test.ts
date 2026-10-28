import { describe, expect, it } from 'vitest';
import { compareServiceNo, toArrivalsDto, toCompactStops } from '../src/transform';
import { NOW, makeStops, rawArrivals } from './fixtures';

describe('toArrivalsDto', () => {
  const dto = toArrivalsDto(rawArrivals, NOW);

  it('keeps the stop code and stamps fetchedAt', () => {
    expect(dto.stopCode).toBe('83139');
    expect(dto.fetchedAt).toBe(new Date(NOW).toISOString());
  });

  it('sorts services in natural order (2A, 13, 15, 155)', () => {
    expect(dto.services.map((s) => s.serviceNo)).toEqual(['2A', '13', '15', '155']);
  });

  it('converts arrivals to whole minutes, flooring partial minutes', () => {
    const svc15 = dto.services.find((s) => s.serviceNo === '15')!;
    expect(svc15.next.map((b) => b.etaMin)).toEqual([0, 7]);
  });

  it('maps load, type, wheelchair and monitored flags', () => {
    const [first, second] = dto.services.find((s) => s.serviceNo === '15')!.next;
    expect(first).toEqual({ etaMin: 0, load: 'SEA', type: 'SD', wheelchair: true, monitored: true });
    expect(second).toEqual({ etaMin: 7, load: 'SDA', type: 'DD', wheelchair: true, monitored: false });
  });

  it('clamps buses whose estimate is already in the past to 0', () => {
    const svc155 = dto.services.find((s) => s.serviceNo === '155')!;
    expect(svc155.next).toEqual([
      { etaMin: 0, load: 'LSD', type: 'BD', wheelchair: false, monitored: true },
    ]);
  });

  it('drops empty and unparseable estimates but keeps the service', () => {
    expect(dto.services.find((s) => s.serviceNo === '13')!.next).toEqual([]);
    expect(dto.services.find((s) => s.serviceNo === '2A')!.next).toEqual([]);
  });

  it('maps unknown load/type codes to null', () => {
    const first = rawArrivals.Services[0]!;
    const raw = {
      ...rawArrivals,
      Services: [{ ...first, NextBus: { ...first.NextBus, Load: 'XYZ', Type: '' } }],
    };
    const [bus] = toArrivalsDto(raw, NOW).services[0]!.next;
    expect(bus!.load).toBeNull();
    expect(bus!.type).toBeNull();
  });

  it('handles a response with no Services array', () => {
    const dto2 = toArrivalsDto({ BusStopCode: '99999' } as never, NOW);
    expect(dto2.services).toEqual([]);
  });

  it('does not mutate the input', () => {
    const before = JSON.stringify(rawArrivals);
    toArrivalsDto(rawArrivals, NOW);
    expect(JSON.stringify(rawArrivals)).toBe(before);
  });
});

describe('compareServiceNo', () => {
  it('orders numerically then by suffix', () => {
    const sorted = ['10', '2', '100', '2A', '2B', 'NR1', '960e'].sort(compareServiceNo);
    expect(sorted).toEqual(['2', '2A', '2B', '10', '100', '960e', 'NR1']);
  });
});

describe('toCompactStops', () => {
  it('converts stops to [code, name, road, lat, lng] tuples', () => {
    expect(toCompactStops(makeStops(1))).toEqual([['10000', 'Stop 0', 'Road 0', 1.3, 103.8]]);
  });

  it('rounds coordinates to 5 decimal places', () => {
    const [stop] = toCompactStops([{ ...makeStops(1)[0]!, Latitude: 1.29684825487647, Longitude: 103.85253591654 }]);
    expect(stop!.slice(3)).toEqual([1.29685, 103.85254]);
  });
});
