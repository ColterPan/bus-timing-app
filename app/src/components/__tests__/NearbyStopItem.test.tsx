import { fireEvent, render, screen } from '@testing-library/react-native';
import { useArrivals } from '../../hooks/useArrivals';
import { NearbyStopItem } from '../NearbyStopItem';

jest.mock('../../hooks/useArrivals');
const mockUseArrivals = useArrivals as jest.MockedFunction<typeof useArrivals>;

const stop = { code: '83139', name: 'Aft Joo Chiat Pl', road: 'Telok Kurau Rd', lat: 1.311, lng: 103.9 };

function setup(overrides: Partial<Parameters<typeof NearbyStopItem>[0]> = {}) {
  const props = {
    stop,
    distanceM: 56,
    expanded: false,
    active: true,
    isFavourite: false,
    onToggleExpand: jest.fn(),
    onToggleFavourite: jest.fn(),
    onOpen: jest.fn(),
    ...overrides,
  };
  return { props, view: render(<NearbyStopItem {...props} />) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseArrivals.mockReturnValue({
    data: {
      stopCode: '83139',
      fetchedAt: 'x',
      services: [{ serviceNo: '15', operator: 'GAS', next: [{ etaMin: 4, load: 'SEA', type: 'SD', wheelchair: true, monitored: true }] }],
    },
    error: null,
    loading: false,
    refreshing: false,
    refresh: jest.fn(),
  });
});

describe('NearbyStopItem', () => {
  it('shows the stop and distance, collapsed by default', async () => {
    const { view } = setup();
    await view;

    expect(screen.getByText('Aft Joo Chiat Pl')).toBeOnTheScreen();
    expect(screen.getByText('83139 · Telok Kurau Rd')).toBeOnTheScreen();
    expect(screen.getByText('56 m')).toBeOnTheScreen();
    expect(screen.queryByTestId('arrival-row-15')).toBeNull();
    // Collapsed rows must not poll the API
    expect(mockUseArrivals).toHaveBeenCalledWith('83139', { active: false });
  });

  it('toggles the dropdown when tapped', async () => {
    const { view, props } = setup();
    await view;

    await fireEvent.press(screen.getByRole('button', { name: /Aft Joo Chiat Pl, 56 m away, show bus times/ }));

    expect(props.onToggleExpand).toHaveBeenCalled();
  });

  it('shows live arrivals and an open link when expanded', async () => {
    const { view, props } = setup({ expanded: true });
    await view;

    expect(mockUseArrivals).toHaveBeenCalledWith('83139', { active: true });
    expect(screen.getByTestId('arrival-row-15')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Open stop 83139' }));
    expect(props.onOpen).toHaveBeenCalled();
  });

  it('stops polling when the screen is not active', async () => {
    const { view } = setup({ expanded: true, active: false });
    await view;

    expect(mockUseArrivals).toHaveBeenCalledWith('83139', { active: false });
  });

  it('shows loading, error and empty states in the dropdown', async () => {
    mockUseArrivals.mockReturnValue({ data: null, error: 'Offline', loading: false, refreshing: false, refresh: jest.fn() });
    const { view, props } = setup({ expanded: true });
    await view;
    expect(screen.getByText('Offline')).toBeOnTheScreen();

    mockUseArrivals.mockReturnValue({
      data: { stopCode: '83139', fetchedAt: 'x', services: [] },
      error: null,
      loading: false,
      refreshing: false,
      refresh: jest.fn(),
    });
    await screen.rerender(<NearbyStopItem {...props} />);
    expect(screen.getByText('No buses right now.')).toBeOnTheScreen();
  });

  it('labels the closest stop', async () => {
    const { view } = setup({ isClosest: true });
    await view;

    expect(screen.getByText('CLOSEST')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Closest stop, Aft Joo Chiat Pl/ })).toBeOnTheScreen();
  });

  it('has no closest label on other stops', async () => {
    const { view } = setup();
    await view;

    expect(screen.queryByText('CLOSEST')).toBeNull();
  });

  it('saves the stop with the star', async () => {
    const { view, props } = setup({ isFavourite: true });
    await view;

    await fireEvent.press(screen.getByRole('button', { name: 'Remove Aft Joo Chiat Pl from favourites' }));

    expect(props.onToggleFavourite).toHaveBeenCalled();
  });
});
