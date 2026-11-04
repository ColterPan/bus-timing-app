import { parseFrameEvent, toMapStops } from '../mapProtocol';

describe('parseFrameEvent', () => {
  it('accepts known events', () => {
    expect(parseFrameEvent('{"type":"ready"}')).toEqual({ type: 'ready' });
    expect(parseFrameEvent('{"type":"stop","code":"83139"}')).toEqual({ type: 'stop', code: '83139' });
    expect(parseFrameEvent('{"type":"image-loaded"}')).toEqual({ type: 'image-loaded' });
    expect(parseFrameEvent('{"type":"image-error"}')).toEqual({ type: 'image-error' });
  });

  it('rejects malformed or unexpected messages', () => {
    expect(parseFrameEvent('not json')).toBeNull();
    expect(parseFrameEvent('null')).toBeNull();
    expect(parseFrameEvent('"ready"')).toBeNull();
    expect(parseFrameEvent('{"type":"stop","code":"12"}')).toBeNull();
    expect(parseFrameEvent('{"type":"stop","code":12345}')).toBeNull();
    expect(parseFrameEvent('{"type":"delete-everything"}')).toBeNull();
  });
});

describe('toMapStops', () => {
  it('keeps only what the map needs', () => {
    expect(toMapStops([{ code: '83139', name: 'Aft Joo Chiat Pl', road: 'Telok Kurau Rd', lat: 1.31, lng: 103.9 }])).toEqual([
      ['83139', 'Aft Joo Chiat Pl', 1.31, 103.9],
    ]);
  });
});
