import type { RawArrivalResponse, RawBusStop } from '../src/types';

// Fixed "now" for tests: 2026-10-16 10:00:00 SGT
export const NOW = Date.parse('2026-10-16T10:00:00+08:00');

const emptyBus = {
  OriginCode: '',
  DestinationCode: '',
  EstimatedArrival: '',
  Monitored: 0,
  Latitude: '0.0',
  Longitude: '0.0',
  VisitNumber: '',
  Load: '',
  Feature: '',
  Type: '',
};

// Shaped like a real DataMall /v3/BusArrival response
export const rawArrivals: RawArrivalResponse = {
  'odata.metadata': 'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival',
  BusStopCode: '83139',
  Services: [
    {
      ServiceNo: '15',
      Operator: 'GAS',
      NextBus: {
        OriginCode: '77009',
        DestinationCode: '77009',
        EstimatedArrival: '2026-10-16T10:00:20+08:00',
        Monitored: 1,
        Latitude: '1.3154918333333334',
        Longitude: '103.9059125',
        VisitNumber: '1',
        Load: 'SEA',
        Feature: 'WAB',
        Type: 'SD',
      },
      NextBus2: {
        OriginCode: '77009',
        DestinationCode: '77009',
        EstimatedArrival: '2026-10-16T10:07:45+08:00',
        Monitored: 0,
        Latitude: '0.0',
        Longitude: '0.0',
        VisitNumber: '1',
        Load: 'SDA',
        Feature: 'WAB',
        Type: 'DD',
      },
      NextBus3: { ...emptyBus },
    },
    {
      ServiceNo: '155',
      Operator: 'SBST',
      NextBus: {
        OriginCode: '52009',
        DestinationCode: '84009',
        EstimatedArrival: '2026-10-16T09:58:00+08:00',
        Monitored: 1,
        Latitude: '1.31',
        Longitude: '103.9',
        VisitNumber: '1',
        Load: 'LSD',
        Feature: '',
        Type: 'BD',
      },
      NextBus2: { ...emptyBus },
      NextBus3: { ...emptyBus },
    },
    {
      ServiceNo: '13',
      Operator: 'SBST',
      NextBus: { ...emptyBus },
      NextBus2: { ...emptyBus },
      NextBus3: { ...emptyBus },
    },
    {
      ServiceNo: '2A',
      Operator: 'GAS',
      NextBus: { ...emptyBus, EstimatedArrival: 'not-a-date', Load: 'SEA', Type: 'SD' },
      NextBus2: { ...emptyBus },
      NextBus3: { ...emptyBus },
    },
  ],
};

export function makeStops(count: number, offset = 0): RawBusStop[] {
  return Array.from({ length: count }, (_, i) => ({
    BusStopCode: String(10000 + offset + i),
    RoadName: `Road ${offset + i}`,
    Description: `Stop ${offset + i}`,
    Latitude: 1.3 + i / 10000,
    Longitude: 103.8 + i / 10000,
  }));
}
