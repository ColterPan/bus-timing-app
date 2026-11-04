import { act, render } from '@testing-library/react-native';
import { Linking } from 'react-native';
import type { BusStop } from '../../types';
import { StopMap } from '../StopMap';

const mockInject = jest.fn();
let mockWebViewProps: Record<string, any> = {};

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
    mockWebViewProps = props;
    React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
    return React.createElement(View, { testID: props.testID });
  });
  return { WebView };
});

const stops: BusStop[] = [
  { code: '83139', name: 'Aft Joo Chiat Pl', road: 'Telok Kurau Rd', lat: 1.311, lng: 103.9 },
];

/** Commands the app injected into the page, decoded. */
function injectedCommands(): any[] {
  return mockInject.mock.calls.map(([js]: [string]) => {
    const json = /onAppCommand\((.*)\);true;$/s.exec(js)?.[1];
    return JSON.parse(json!);
  });
}

const send = async (data: string) => act(async () => mockWebViewProps.onMessage({ nativeEvent: { data } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockWebViewProps = {};
});

describe('StopMap', () => {
  const baseProps = { stops, user: null, nearestCodes: [], recenterToken: 0, onSelectStop: jest.fn() };

  it('renders the map page and waits for it to be ready', async () => {
    await render(<StopMap {...baseProps} />);

    expect(mockWebViewProps.source.html).toContain('leaflet');
    expect(mockInject).not.toHaveBeenCalled();
  });

  it('sends the stops and user once the page is ready', async () => {
    await render(<StopMap {...baseProps} user={{ lat: 1.31, lng: 103.9 }} nearestCodes={['83139']} />);
    await send('{"type":"ready"}');

    expect(injectedCommands()).toEqual([
      { type: 'stops', stops: [['83139', 'Aft Joo Chiat Pl', 1.311, 103.9]] },
      { type: 'user', position: { lat: 1.31, lng: 103.9 }, nearest: ['83139'], recenter: false, radiusM: 500 },
    ]);
  });

  it('re-sends everything if the page reloads', async () => {
    await render(<StopMap {...baseProps} />);
    await send('{"type":"ready"}');
    await send('{"type":"ready"}');

    expect(injectedCommands().filter((c) => c.type === 'stops')).toHaveLength(2);
  });

  it('recentres when the token changes', async () => {
    const { rerender } = await render(<StopMap {...baseProps} user={{ lat: 1.31, lng: 103.9 }} />);
    await send('{"type":"ready"}');
    mockInject.mockClear();

    await rerender(<StopMap {...baseProps} user={{ lat: 1.31, lng: 103.9 }} recenterToken={1} />);

    expect(injectedCommands()).toContainEqual(expect.objectContaining({ type: 'user', recenter: true }));
  });

  it('reports pin taps and ignores junk messages', async () => {
    const onSelectStop = jest.fn();
    await render(<StopMap {...baseProps} onSelectStop={onSelectStop} />);

    await send('{"type":"stop","code":"83139"}');
    await send('garbage');
    await send('{"type":"stop","code":"<script>"}');

    expect(onSelectStop).toHaveBeenCalledTimes(1);
    expect(onSelectStop).toHaveBeenCalledWith('83139');
  });

  it('opens outside links (map credits) in the browser instead of inside the map', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<StopMap {...baseProps} />);

    expect(mockWebViewProps.onShouldStartLoadWithRequest({ url: 'about:blank' })).toBe(true);
    expect(mockWebViewProps.onShouldStartLoadWithRequest({ url: 'https://www.onemap.gov.sg/' })).toBe(false);
    expect(openURL).toHaveBeenCalledWith('https://www.onemap.gov.sg/');
  });
});
