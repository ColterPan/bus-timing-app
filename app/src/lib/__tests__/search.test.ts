import type { BusStop } from '../../types';
import { isStopCode, searchStops } from '../search';

const stops: BusStop[] = [
  { code: '83139', name: 'Blk 89', road: 'Joo Chiat Rd', lat: 0, lng: 0 },
  { code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St', lat: 0, lng: 0 },
  { code: '01013', name: "St. Joseph's Ch", road: 'Victoria St', lat: 0, lng: 0 },
  { code: '83131', name: 'Opp Joo Chiat Complex', road: 'Joo Chiat Rd', lat: 0, lng: 0 },
  { code: '46971', name: 'Woodlands Int', road: 'Woodlands Sq', lat: 0, lng: 0 },
];

describe('isStopCode', () => {
  it('accepts exactly 5 digits, ignoring whitespace', () => {
    expect(isStopCode('83139')).toBe(true);
    expect(isStopCode(' 83139 ')).toBe(true);
    expect(isStopCode('8313')).toBe(false);
    expect(isStopCode('831390')).toBe(false);
    expect(isStopCode('joo')).toBe(false);
  });
});

describe('searchStops', () => {
  it('returns nothing for an empty query', () => {
    expect(searchStops(stops, '   ')).toEqual([]);
  });

  it('puts an exact code match first, then code prefixes', () => {
    expect(searchStops(stops, '83139').map((s) => s.code)).toEqual(['83139']);
    expect(searchStops(stops, '8313').map((s) => s.code)).toEqual(['83131', '83139']);
  });

  it('matches name and road case-insensitively', () => {
    expect(searchStops(stops, 'VICTORIA').map((s) => s.code)).toEqual(['01012', '01013']);
  });

  it('ranks name prefix above road and substring matches', () => {
    const result = searchStops(stops, 'joo').map((s) => s.code);
    // "Joo Chiat Complex" (word in name) beats "Blk 89" on Joo Chiat Rd (road only)
    expect(result).toEqual(['83131', '83139']);
  });

  it('matches substrings inside the name', () => {
    expect(searchStops(stops, 'grand').map((s) => s.code)).toEqual(['01012']);
    expect(searchStops(stops, 'seph').map((s) => s.code)).toEqual(['01013']);
  });

  it('matches road substrings', () => {
    expect(searchStops(stops, 'lands sq').map((s) => s.code)).toEqual(['46971']);
  });

  it('honours the limit', () => {
    expect(searchStops(stops, 'o', 2)).toHaveLength(2);
  });
});
