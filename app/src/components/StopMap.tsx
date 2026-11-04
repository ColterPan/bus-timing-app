import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NEARBY_RADIUS_M, type LatLng } from '../lib/geo';
import { buildStopMapHtml } from '../lib/mapHtml';
import { parseFrameEvent, toMapStops, type MapCommand } from '../lib/mapProtocol';
import { useTheme } from '../theme';
import type { BusStop } from '../types';
import { HtmlFrame } from './HtmlFrame';
import type { HtmlFrameHandle } from './HtmlFrame.types';

interface StopMapProps {
  stops: readonly BusStop[];
  user: LatLng | null;
  nearestCodes: readonly string[];
  /** Change this number to re-centre the map on the user. */
  recenterToken: number;
  onSelectStop: (code: string) => void;
}

/** Interactive map of bus stops with the user's position (Leaflet + OneMap). */
export function StopMap({ stops, user, nearestCodes, recenterToken, onSelectStop }: StopMapProps) {
  const { dark } = useTheme();
  const html = useMemo(() => buildStopMapHtml({ dark }), [dark]);
  const frame = useRef<HtmlFrameHandle>(null);
  // Bumped on every "ready" so a reloaded page (e.g. theme change) gets its data again
  const [readyCount, setReadyCount] = useState(0);
  const lastRecenterToken = useRef(recenterToken);

  const post = (command: MapCommand) => frame.current?.post(command);

  const onMessage = useCallback(
    (raw: string) => {
      const event = parseFrameEvent(raw);
      if (event?.type === 'ready') setReadyCount((n) => n + 1);
      else if (event?.type === 'stop') onSelectStop(event.code);
    },
    [onSelectStop],
  );

  useEffect(() => {
    if (readyCount > 0) post({ type: 'stops', stops: toMapStops(stops) });
  }, [readyCount, stops]);

  useEffect(() => {
    if (readyCount > 0) {
      post({ type: 'user', position: user, nearest: nearestCodes, recenter: false, radiusM: NEARBY_RADIUS_M });
    }
  }, [readyCount, user, nearestCodes]);

  useEffect(() => {
    if (readyCount === 0 || recenterToken === lastRecenterToken.current) return;
    lastRecenterToken.current = recenterToken;
    post({ type: 'user', position: user, nearest: nearestCodes, recenter: true, radiusM: NEARBY_RADIUS_M });
  }, [readyCount, recenterToken, user, nearestCodes]);

  return <HtmlFrame ref={frame} html={html} onMessage={onMessage} title="Map of nearby bus stops" testID="stop-map" />;
}
