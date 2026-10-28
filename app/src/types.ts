// Mirrors the DTOs served by the proxy (server/src/types.ts)

export type Load = 'SEA' | 'SDA' | 'LSD';
export type BusType = 'SD' | 'DD' | 'BD';

export interface NextBus {
  etaMin: number;
  load: Load | null;
  type: BusType | null;
  wheelchair: boolean;
  monitored: boolean;
}

export interface ServiceArrival {
  serviceNo: string;
  operator: string;
  next: NextBus[];
}

export interface Arrivals {
  stopCode: string;
  fetchedAt: string;
  services: ServiceArrival[];
}

/** [code, description, roadName, lat, lng] as served by GET /stops */
export type CompactStop = [string, string, string, number, number];

export interface BusStop {
  code: string;
  name: string;
  road: string;
  lat: number;
  lng: number;
}

export interface Favourite {
  stopCode: string;
  /** Services pinned for the Home screen. Empty = show every service. */
  serviceNos: string[];
}

/** Minimal async key-value store; AsyncStorage satisfies this. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
