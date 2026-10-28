import { fireEvent, render, screen } from '@testing-library/react-native';
import { useArrivals } from '../../hooks/useArrivals';
import { useFavourites } from '../../store/FavouritesContext';
import { useStops } from '../../store/StopsContext';
import { FavouriteCard } from '../FavouriteCard';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../hooks/useArrivals');
jest.mock('../../store/StopsContext');
jest.mock('../../store/FavouritesContext');

const mockUseArrivals = useArrivals as jest.MockedFunction<typeof useArrivals>;
const mockToggleStop = jest.fn();

const arrivalsState = (overrides: Partial<ReturnType<typeof useArrivals>> = {}) => ({
  data: {
    stopCode: '83139',
    fetchedAt: 'x',
    services: [
      { serviceNo: '15', operator: 'GAS', next: [{ etaMin: 3, load: 'SEA' as const, type: 'SD' as const, wheelchair: true, monitored: true }] },
      { serviceNo: '155', operator: 'SBST', next: [] },
    ],
  },
  error: null,
  loading: false,
  refreshing: false,
  refresh: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  (useStops as jest.Mock).mockReturnValue({
    byCode: new Map([['83139', { code: '83139', name: 'Blk 89', road: 'Joo Chiat Rd', lat: 0, lng: 0 }]]),
  });
  (useFavourites as jest.Mock).mockReturnValue({ toggleStop: mockToggleStop });
});

describe('FavouriteCard', () => {
  it('shows the stop name and every service when none are pinned', async () => {
    mockUseArrivals.mockReturnValue(arrivalsState());
    await render(<FavouriteCard favourite={{ stopCode: '83139', serviceNos: [] }} active />);

    expect(screen.getByText('Blk 89')).toBeOnTheScreen();
    expect(screen.getByTestId('arrival-row-15')).toBeOnTheScreen();
    expect(screen.getByTestId('arrival-row-155')).toBeOnTheScreen();
    expect(mockUseArrivals).toHaveBeenCalledWith('83139', { active: true });
  });

  it('shows only pinned services', async () => {
    mockUseArrivals.mockReturnValue(arrivalsState());
    await render(<FavouriteCard favourite={{ stopCode: '83139', serviceNos: ['155'] }} active />);

    expect(screen.queryByTestId('arrival-row-15')).toBeNull();
    expect(screen.getByTestId('arrival-row-155')).toBeOnTheScreen();
  });

  it('opens the stop and can unfavourite it', async () => {
    mockUseArrivals.mockReturnValue(arrivalsState());
    await render(<FavouriteCard favourite={{ stopCode: '83139', serviceNos: [] }} active />);

    await fireEvent.press(screen.getByText('Blk 89'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/stop/[code]', params: { code: '83139' } });

    await fireEvent.press(screen.getByRole('button', { name: 'Remove from favourites' }));
    expect(mockToggleStop).toHaveBeenCalledWith('83139');
  });

  it('shows errors and an empty message', async () => {
    mockUseArrivals.mockReturnValue(
      arrivalsState({ error: 'Offline', data: { stopCode: '99999', fetchedAt: 'x', services: [] } }),
    );
    await render(<FavouriteCard favourite={{ stopCode: '99999', serviceNos: [] }} active={false} />);

    expect(screen.getByText('Stop 99999')).toBeOnTheScreen();
    expect(screen.getByText('Offline')).toBeOnTheScreen();
    expect(screen.getByText('No buses right now.')).toBeOnTheScreen();
  });
});
