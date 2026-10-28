// ---- Raw LTA DataMall shapes ----

export interface RawNextBus {
  OriginCode: string;
  DestinationCode: string;
  /** ISO 8601 with +08:00 offset, or "" when there is no estimate */
  EstimatedArrival: string;
  /** 1 = live GPS estimate, 0 = based on schedule */
  Monitored: number;
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  /** SEA = seats available, SDA = standing available, LSD = limited standing */
  Load: string;
  /** "WAB" = wheelchair accessible */
  Feature: string;
  /** SD = single deck, DD = double deck, BD = bendy */
  Type: string;
}

export interface RawService {
  ServiceNo: string;
  Operator: string;
  NextBus: RawNextBus;
  NextBus2: RawNextBus;
  NextBus3: RawNextBus;
}

export interface RawArrivalResponse {
  'odata.metadata'?: string;
  BusStopCode: string;
  Services: RawService[];
}

export interface RawBusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
}

// ---- Clean DTOs served to the app ----

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

export interface ArrivalsDto {
  stopCode: string;
  fetchedAt: string;
  services: ServiceArrival[];
}

/** [code, description, roadName, lat, lng] */
export type CompactStop = [string, string, string, number, number];
