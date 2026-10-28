import type {
  ArrivalsDto,
  BusType,
  CompactStop,
  Load,
  NextBus,
  RawArrivalResponse,
  RawBusStop,
  RawNextBus,
  RawService,
} from './types';

const MS_PER_MINUTE = 60_000;
const LOADS: readonly string[] = ['SEA', 'SDA', 'LSD'];
const BUS_TYPES: readonly string[] = ['SD', 'DD', 'BD'];

function toNextBus(raw: RawNextBus | undefined, now: number): NextBus | null {
  if (!raw?.EstimatedArrival) return null;
  const arrivalMs = Date.parse(raw.EstimatedArrival);
  if (Number.isNaN(arrivalMs)) return null;

  return {
    etaMin: Math.max(0, Math.floor((arrivalMs - now) / MS_PER_MINUTE)),
    load: LOADS.includes(raw.Load) ? (raw.Load as Load) : null,
    type: BUS_TYPES.includes(raw.Type) ? (raw.Type as BusType) : null,
    wheelchair: raw.Feature === 'WAB',
    monitored: raw.Monitored === 1,
  };
}

function splitServiceNo(serviceNo: string): [number, string] {
  const match = /^(\d+)(.*)$/.exec(serviceNo);
  return match ? [Number(match[1]), match[2] ?? ''] : [Number.POSITIVE_INFINITY, serviceNo];
}

/** Natural order: 2, 2A, 10, 100, then non-numeric services (e.g. NR1) last. */
export function compareServiceNo(a: string, b: string): number {
  const [numA, restA] = splitServiceNo(a);
  const [numB, restB] = splitServiceNo(b);
  if (numA !== numB) return numA < numB ? -1 : 1;
  return restA.localeCompare(restB);
}

function toServiceArrival(service: RawService, now: number) {
  const next = [service.NextBus, service.NextBus2, service.NextBus3]
    .map((bus) => toNextBus(bus, now))
    .filter((bus): bus is NextBus => bus !== null);
  return { serviceNo: service.ServiceNo, operator: service.Operator, next };
}

export function toArrivalsDto(raw: RawArrivalResponse, now: number): ArrivalsDto {
  const services = (raw.Services ?? [])
    .map((service) => toServiceArrival(service, now))
    .sort((a, b) => compareServiceNo(a.serviceNo, b.serviceNo));

  return { stopCode: raw.BusStopCode, fetchedAt: new Date(now).toISOString(), services };
}

// 5 decimal places ≈ 1.1 m, plenty for "nearby" and ~25% smaller payload
const roundCoord = (n: number) => Math.round(n * 1e5) / 1e5;

export function toCompactStops(stops: readonly RawBusStop[]): CompactStop[] {
  return stops.map((s) => [
    s.BusStopCode,
    s.Description,
    s.RoadName,
    roundCoord(s.Latitude),
    roundCoord(s.Longitude),
  ]);
}
