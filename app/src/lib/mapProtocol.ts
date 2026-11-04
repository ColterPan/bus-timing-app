import type { BusStop } from '../types';
import type { LatLng } from './geo';

/** [code, name, lat, lng]: the slimmed-down stop the map page needs. */
export type MapStop = [string, string, number, number];

/** Commands the app sends into the map page. */
export type MapCommand =
  | { type: 'stops'; stops: MapStop[] }
  | { type: 'user'; position: LatLng | null; nearest: readonly string[]; recenter: boolean; radiusM: number };

/** Events an embedded page (stop map or image viewer) sends back to the app. */
export type FrameEvent =
  | { type: 'ready' }
  | { type: 'stop'; code: string }
  | { type: 'image-loaded' }
  | { type: 'image-error' };

const STOP_CODE_PATTERN = /^\d{5}$/;
const SIMPLE_EVENTS: ReadonlySet<string> = new Set(['ready', 'image-loaded', 'image-error']);

/** Validates a message from the embedded page; anything unexpected is dropped. */
export function parseFrameEvent(raw: string): FrameEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;

  const { type, code } = value as { type?: unknown; code?: unknown };
  if (typeof type === 'string' && SIMPLE_EVENTS.has(type)) return { type } as FrameEvent;
  if (type === 'stop' && typeof code === 'string' && STOP_CODE_PATTERN.test(code)) return { type: 'stop', code };
  return null;
}

export function toMapStops(stops: readonly BusStop[]): MapStop[] {
  return stops.map((s) => [s.code, s.name, s.lat, s.lng]);
}
