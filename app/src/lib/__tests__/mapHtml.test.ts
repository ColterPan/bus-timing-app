import { buildImageViewerHtml, buildStopMapHtml } from '../mapHtml';

const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

function pageScript(html: string): string {
  const match = /<script id="app">([\s\S]*?)<\/script>/.exec(html);
  if (!match) throw new Error('app script not found');
  return match[1]!;
}

/** Minimal Leaflet stand-in so the in-page script can run under Jest. */
function fakeLeaflet() {
  const handlers: Record<string, () => void> = {};
  const layerItems: any[] = [];
  const map = {
    zoom: 12,
    setView: jest.fn(function (this: any, _c: unknown, z: number) {
      this.zoom = z;
      return this;
    }),
    getZoom(this: any) {
      return this.zoom;
    },
    getBounds() {
      return {
        pad() {
          return this;
        },
        contains([lat, lng]: [number, number]) {
          return lat > 1.3 && lat < 1.32 && lng > 103.89 && lng < 103.91;
        },
      };
    },
    on(events: string, fn: () => void) {
      events.split(' ').forEach((e) => (handlers[e] = fn));
      return map;
    },
  };
  const layer = {
    addTo: () => layer,
    clearLayers: () => layerItems.splice(0),
    addLayer: (m: unknown) => layerItems.push(m),
  };
  const userMarker = { latlng: null as unknown, setLatLng: jest.fn(), addTo: jest.fn(), remove: jest.fn() };
  userMarker.setLatLng.mockImplementation((l) => ((userMarker.latlng = l), userMarker));
  userMarker.addTo.mockReturnValue(userMarker);
  const circle = {
    latlng: null as unknown,
    radius: 0,
    setLatLng: jest.fn(),
    setRadius: jest.fn(),
    addTo: jest.fn(),
    remove: jest.fn(),
  };
  circle.setLatLng.mockImplementation((l) => ((circle.latlng = l), circle));
  circle.setRadius.mockImplementation((r) => ((circle.radius = r), circle));
  circle.addTo.mockReturnValue(circle);
  const L = {
    circle: jest.fn((latlng: unknown, opts: { radius: number }) => {
      circle.latlng = latlng;
      circle.radius = opts.radius;
      return circle;
    }),
    map: jest.fn(() => map),
    tileLayer: jest.fn(() => ({ addTo: () => undefined })),
    layerGroup: () => layer,
    divIcon: (o: unknown) => o,
    marker: jest.fn((latlng: unknown) => ((userMarker.latlng = latlng), userMarker)),
    circleMarker: (latlng: [number, number], opts: any) => {
      const m: any = { latlng, opts, handlers: {} as Record<string, () => void>, tooltip: null };
      m.bindTooltip = (el: unknown) => ((m.tooltip = el), m);
      m.on = (e: string, fn: () => void) => ((m.handlers[e] = fn), m);
      m.addTo = (g: typeof layer) => (g.addLayer(m), m);
      return m;
    },
  };
  return { L, map, handlers, layerItems, userMarker, circle };
}

function runMapPage(dark = false) {
  const leaflet = fakeLeaflet();
  const sent: any[] = [];
  const win: any = {
    ReactNativeWebView: { postMessage: (s: string) => sent.push(JSON.parse(s)) },
    addEventListener: jest.fn(),
  };
  const doc = { createElement: () => ({ textContent: '', className: '' }) };
  // eslint-disable-next-line no-new-func
  new Function('L', 'window', 'document', pageScript(buildStopMapHtml({ dark })))(leaflet.L, win, doc);
  return { ...leaflet, win, sent };
}

const STOPS = [
  ['83139', 'Aft Joo Chiat Pl', 1.311, 103.9],
  ['82151', 'Bef Joo Chiat Pl', 1.312, 103.901],
  ['01012', 'Hotel Grand Pacific', 1.2968, 103.8525], // outside the fake viewport
];

describe('buildStopMapHtml', () => {
  it('loads Leaflet with integrity hashes and OneMap tiles with attribution', () => {
    const html = buildStopMapHtml({ dark: false });
    expect(html).toContain(LEAFLET_JS_SRI);
    expect(html).toContain(LEAFLET_CSS_SRI);
    expect(html).toContain('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png');
    expect(html).toContain('Singapore Land Authority');
  });

  it('uses the Night tiles and dark map controls in dark mode', () => {
    const html = buildStopMapHtml({ dark: true });
    expect(html).toContain('/maps/tiles/Night/');
    expect(html).toContain('.leaflet-control-attribution { background: rgba(22, 27, 38');
    expect(buildStopMapHtml({ dark: false })).not.toContain('.leaflet-control-attribution {');
  });

  it('never builds HTML from stop names', () => {
    expect(pageScript(buildStopMapHtml({ dark: false }))).not.toMatch(/innerHTML/);
  });
});

describe('map page script', () => {
  it('announces it is ready and listens for app commands', () => {
    const { sent, win } = runMapPage();
    expect(sent).toEqual([{ type: 'ready' }]);
    expect(typeof win.onAppCommand).toBe('function');
    expect(win.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('only shows pins once zoomed in, limited to the viewport', () => {
    const { win, map, handlers, layerItems } = runMapPage();
    win.onAppCommand({ type: 'stops', stops: STOPS });
    expect(layerItems).toHaveLength(0); // zoom 12: too far out

    map.zoom = 16;
    handlers.moveend!();
    expect(layerItems.map((m) => m.latlng)).toEqual([
      [1.311, 103.9],
      [1.312, 103.901],
    ]);
    expect(layerItems[0].tooltip.textContent).toBe('Aft Joo Chiat Pl (83139)');
  });

  it('tapping a pin tells the app which stop', () => {
    const { win, map, handlers, layerItems, sent } = runMapPage();
    win.onAppCommand({ type: 'stops', stops: STOPS });
    map.zoom = 17;
    handlers.moveend!();
    layerItems[1].handlers.click();
    expect(sent).toContainEqual({ type: 'stop', code: '82151' });
  });

  it('shows the user, highlights nearest stops at any zoom, and centres on the first fix', () => {
    const { win, map, layerItems, userMarker } = runMapPage();
    win.onAppCommand({ type: 'stops', stops: STOPS });
    win.onAppCommand({ type: 'user', position: { lat: 1.3112, lng: 103.9 }, nearest: ['83139'], recenter: false });

    expect(userMarker.latlng).toEqual([1.3112, 103.9]);
    expect(map.setView).toHaveBeenCalledWith([1.3112, 103.9], 17);
    const nearest = layerItems.find((m) => m.latlng[0] === 1.311);
    expect(nearest.opts.className).toContain('nearest');

    map.setView.mockClear();
    win.onAppCommand({ type: 'user', position: { lat: 1.3113, lng: 103.9 }, nearest: ['83139'], recenter: false });
    expect(map.setView).not.toHaveBeenCalled(); // don't yank the map while the user is exploring

    win.onAppCommand({ type: 'user', position: { lat: 1.3113, lng: 103.9 }, nearest: ['83139'], recenter: true });
    expect(map.setView).toHaveBeenCalledWith([1.3113, 103.9], 17);
  });

  it('draws the search-radius circle around the user and moves it with them', () => {
    const { win, L, circle } = runMapPage();
    win.onAppCommand({ type: 'user', position: { lat: 1.31, lng: 103.9 }, nearest: [], recenter: false, radiusM: 500 });

    expect(L.circle).toHaveBeenCalledTimes(1);
    expect(circle.latlng).toEqual([1.31, 103.9]);
    expect(circle.radius).toBe(500);

    win.onAppCommand({ type: 'user', position: { lat: 1.32, lng: 103.91 }, nearest: [], recenter: false, radiusM: 500 });
    expect(L.circle).toHaveBeenCalledTimes(1); // reused, not redrawn
    expect(circle.latlng).toEqual([1.32, 103.91]);
  });

  it('removes the dot and circle when location is unavailable', () => {
    const { win, userMarker, circle } = runMapPage();
    win.onAppCommand({ type: 'user', position: { lat: 1.31, lng: 103.9 }, nearest: [], recenter: false, radiusM: 500 });
    win.onAppCommand({ type: 'user', position: null, nearest: [], recenter: false, radiusM: 500 });

    expect(userMarker.remove).toHaveBeenCalled();
    expect(circle.remove).toHaveBeenCalled();
  });

  it('ignores unknown commands', () => {
    const { win } = runMapPage();
    expect(() => win.onAppCommand({ type: 'bogus' })).not.toThrow();
    expect(() => win.onAppCommand(null)).not.toThrow();
  });
});

describe('buildImageViewerHtml', () => {
  it('shows the image and reports load/error', () => {
    const html = buildImageViewerHtml('https://example.com/map(1).png', { dark: false });
    expect(html).toContain('src="https://example.com/map(1).png"');
    expect(html).toContain('image-loaded');
    expect(html).toContain('image-error');
    expect(html).toContain('user-scalable=yes');
  });

  it('escapes the URL so it cannot break out of the attribute', () => {
    const html = buildImageViewerHtml('https://x.com/a"onerror="alert(1)', { dark: true });
    expect(html).not.toContain('"onerror="');
    expect(html).toContain('&quot;onerror=&quot;');
  });
});
