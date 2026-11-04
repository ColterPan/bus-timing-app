// HTML pages rendered inside a WebView (Android/iOS) or iframe (web).
// The map uses Leaflet with OneMap tiles: Singapore Land Authority's free basemap, no API key needed.

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

const ONEMAP_TILES = (style: 'Default' | 'Night') => `https://www.onemap.gov.sg/maps/tiles/${style}/{z}/{x}/{y}.png`;
// Attribution wording required by OneMap's terms of use
const ONEMAP_ATTRIBUTION =
  '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;vertical-align:middle"/>' +
  '&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>' +
  '&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;' +
  '<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>';

const BG = { light: '#F2F3F7', dark: '#0B0F17' };

/** Sends a message to the app from inside the page (WebView bridge or parent window). */
const SEND_FN = `function send(msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage(s, '*');
  }`;

function mapScript(tilesUrl: string): string {
  return `(function () {
  var MIN_PIN_ZOOM = 15;
  var MAX_PINS = 300;
  var FOCUS_ZOOM = 17;
  ${SEND_FN}

  var map = L.map('map', {
    minZoom: 11,
    maxZoom: 19,
    maxBounds: [[1.13, 103.55], [1.5, 104.1]],
    maxBoundsViscosity: 1
  }).setView([1.3521, 103.8198], 12);
  L.tileLayer(${JSON.stringify(tilesUrl)}, {
    minZoom: 11,
    maxZoom: 19,
    detectRetina: true,
    attribution: ${JSON.stringify(ONEMAP_ATTRIBUTION)}
  }).addTo(map);

  var pins = L.layerGroup().addTo(map);
  var stops = [];
  var nearest = {};
  var userMarker = null;
  var centred = false;

  function label(stop) {
    // Plain text only (no HTML parsing): stop names come from an external API
    var el = document.createElement('span');
    el.textContent = stop[1] + ' (' + stop[0] + ')';
    return el;
  }

  function addPin(stop, isNearest) {
    L.circleMarker([stop[2], stop[3]], {
      radius: isNearest ? 9 : 7,
      weight: 2,
      color: '#FFFFFF',
      fillColor: isNearest ? '#E8590C' : '#1E6FD9',
      fillOpacity: 1,
      className: isNearest ? 'pin nearest' : 'pin'
    })
      .bindTooltip(label(stop), { direction: 'top', offset: [0, -8] })
      .on('click', function () { send({ type: 'stop', code: stop[0] }); })
      .addTo(pins);
  }

  // Only draw stops in view once zoomed in, so ~5,000 stops stay fast; nearest stops always show
  function render() {
    pins.clearLayers();
    var showAll = map.getZoom() >= MIN_PIN_ZOOM;
    var bounds = map.getBounds().pad(0.25);
    var count = 0;
    for (var i = 0; i < stops.length; i++) {
      var s = stops[i];
      var isNearest = nearest[s[0]] === true;
      if (isNearest) {
        addPin(s, true);
      } else if (showAll && count < MAX_PINS && bounds.contains([s[2], s[3]])) {
        addPin(s, false);
        count++;
      }
    }
  }

  function setUser(position) {
    if (!position) {
      if (userMarker) { userMarker.remove(); userMarker = null; }
      return;
    }
    var latLng = [position.lat, position.lng];
    if (userMarker) {
      userMarker.setLatLng(latLng);
    } else {
      userMarker = L.marker(latLng, {
        icon: L.divIcon({ className: 'user-dot', iconSize: [20, 20] }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 1000
      }).addTo(map);
    }
  }

  window.onAppCommand = function (cmd) {
    if (!cmd || typeof cmd !== 'object') return;
    if (cmd.type === 'stops' && Array.isArray(cmd.stops)) {
      stops = cmd.stops;
      render();
    } else if (cmd.type === 'user') {
      nearest = {};
      (cmd.nearest || []).forEach(function (code) { nearest[code] = true; });
      setUser(cmd.position);
      // Centre on the first fix or when asked; otherwise leave the map where the user dragged it
      if (cmd.position && (cmd.recenter || !centred)) {
        centred = true;
        map.setView([cmd.position.lat, cmd.position.lng], FOCUS_ZOOM);
      }
      render();
    }
  };

  map.on('moveend zoomend', render);
  window.addEventListener('message', function (event) {
    try {
      window.onAppCommand(typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
    } catch (err) {
      // Not one of our commands (e.g. a browser extension message); ignore it
    }
  });
  send({ type: 'ready' });
})();`;
}

export function buildStopMapHtml({ dark }: { dark: boolean }): string {
  const bg = dark ? BG.dark : BG.light;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="${LEAFLET_CSS}" integrity="${LEAFLET_CSS_SRI}" crossorigin="anonymous">
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: ${bg}; }
  .user-dot {
    box-sizing: border-box; background: #1E6FD9; border: 3px solid #FFFFFF; border-radius: 50%;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(30, 111, 217, 0.6); }
    70% { box-shadow: 0 0 0 16px rgba(30, 111, 217, 0); }
    100% { box-shadow: 0 0 0 0 rgba(30, 111, 217, 0); }
  }
  .leaflet-tooltip { font: 13px system-ui, sans-serif; }
</style>
</head>
<body>
<div id="map"></div>
<script src="${LEAFLET_JS}" integrity="${LEAFLET_JS_SRI}" crossorigin="anonymous"></script>
<script id="app">${mapScript(ONEMAP_TILES(dark ? 'Night' : 'Default'))}</script>
</body>
</html>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** A pinch-zoomable image page (also tap-to-zoom, for web) that reports load / error. */
export function buildImageViewerHtml(url: string, { dark }: { dark: boolean }): string {
  const bg = dark ? BG.dark : BG.light;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=6, user-scalable=yes">
<style>
  html, body { margin: 0; background: ${bg}; }
  body { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  img { display: block; width: 100%; height: auto; cursor: zoom-in; }
  body.zoomed { display: block; }
  body.zoomed img { width: 250%; max-width: none; cursor: zoom-out; }
</style>
</head>
<body>
<img id="image" alt="Singapore MRT and LRT system map" src="${escapeAttr(url)}">
<script id="app">(function () {
  ${SEND_FN}
  var img = document.getElementById('image');
  img.addEventListener('load', function () { send({ type: 'image-loaded' }); });
  img.addEventListener('error', function () { send({ type: 'image-error' }); });
  img.addEventListener('click', function () { document.body.classList.toggle('zoomed'); });
  if (img.complete && img.naturalWidth > 0) send({ type: 'image-loaded' });
})();</script>
</body>
</html>`;
}
