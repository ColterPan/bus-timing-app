import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchStops } from '../../api/client';
import { FAVOURITES_KEY } from '../favourites';
import { FavouritesProvider, useFavourites } from '../FavouritesContext';
import { STOPS_KEY } from '../stops';
import { StopsProvider, useStops } from '../StopsContext';

jest.mock('../../api/client', () => ({ fetchStops: jest.fn() }));
const mockFetchStops = fetchStops as jest.MockedFunction<typeof fetchStops>;

beforeEach(async () => {
  await AsyncStorage.clear();
  mockFetchStops.mockReset();
});

describe('FavouritesProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <FavouritesProvider>{children}</FavouritesProvider>;

  it('loads stored favourites and persists changes', async () => {
    await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify([{ stopCode: '83139', serviceNos: [] }]));
    const { result } = await renderHook(() => useFavourites(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.favourites).toEqual([{ stopCode: '83139', serviceNos: [] }]);

    await act(() => result.current.toggleService('01012', '7'));
    await act(() => result.current.toggleStop('83139'));

    expect(result.current.favourites).toEqual([{ stopCode: '01012', serviceNos: ['7'] }]);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem(FAVOURITES_KEY))!)).toEqual([
        { stopCode: '01012', serviceNos: ['7'] },
      ]),
    );
  });

  it('throws a helpful error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useFavourites())).rejects.toThrow(/FavouritesProvider/);
  });
});

describe('StopsProvider', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <StopsProvider>{children}</StopsProvider>;

  it('downloads stops and indexes them by code', async () => {
    mockFetchStops.mockResolvedValue([['83139', 'Blk 89', 'Joo Chiat Rd', 1.31, 103.9]]);
    const { result } = await renderHook(() => useStops(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stops).toHaveLength(1);
    expect(result.current.byCode.get('83139')?.name).toBe('Blk 89');
    expect(await AsyncStorage.getItem(STOPS_KEY)).not.toBeNull();
  });

  it('exposes an error and can retry', async () => {
    mockFetchStops.mockRejectedValueOnce(new Error('offline'));
    const { result } = await renderHook(() => useStops(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('offline'));

    mockFetchStops.mockResolvedValueOnce([['01012', 'Hotel', 'Victoria St', 1.29, 103.85]]);
    await act(() => result.current.retry());

    expect(result.current.error).toBeNull();
    expect(result.current.stops[0]?.code).toBe('01012');
  });

  it('throws a helpful error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useStops())).rejects.toThrow(/StopsProvider/);
  });
});
