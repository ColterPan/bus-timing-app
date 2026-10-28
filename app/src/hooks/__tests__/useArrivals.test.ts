import { act, renderHook } from '@testing-library/react-native';
import type { Arrivals } from '../../types';
import { useArrivals } from '../useArrivals';

const arrivals = (stopCode: string, fetchedAt = 't1'): Arrivals => ({ stopCode, fetchedAt, services: [] });

describe('useArrivals', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('loads immediately when active', async () => {
    const fetcher = jest.fn().mockResolvedValue(arrivals('83139'));
    const { result } = await renderHook(() => useArrivals('83139', { active: true, fetcher }));

    expect(fetcher).toHaveBeenCalledWith('83139');
    expect(result.current.data).toEqual(arrivals('83139'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch while inactive', async () => {
    const fetcher = jest.fn();
    const { result } = await renderHook(() => useArrivals('83139', { active: false, fetcher }));

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it('polls on the interval and stops when deactivated', async () => {
    const fetcher = jest.fn().mockResolvedValue(arrivals('83139'));
    const { rerender } = await renderHook((props: { active: boolean }) =>
      useArrivals('83139', { active: props.active, fetcher, intervalMs: 1000 }),
      { initialProps: { active: true } },
    );
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTimeAsync(1000));
    expect(fetcher).toHaveBeenCalledTimes(2);

    await rerender({ active: false });
    await act(() => jest.advanceTimersByTimeAsync(5000));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps the last good data when a refresh fails', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(arrivals('83139'))
      .mockRejectedValueOnce(new Error("Can't reach the bus server."));
    const { result } = await renderHook(() => useArrivals('83139', { active: true, fetcher, intervalMs: 1000 }));

    await act(() => jest.advanceTimersByTimeAsync(1000));

    expect(result.current.data).toEqual(arrivals('83139'));
    expect(result.current.error).toBe("Can't reach the bus server.");
  });

  it('uses a generic message for non-Error failures', async () => {
    const fetcher = jest.fn().mockRejectedValue('weird');
    const { result } = await renderHook(() => useArrivals('83139', { active: true, fetcher }));

    expect(result.current.error).toBe('Could not load bus arrivals.');
    expect(result.current.data).toBeNull();
  });

  it('refresh() fetches again and toggles refreshing', async () => {
    let resolve!: (value: Arrivals) => void;
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(arrivals('83139', 't1'))
      .mockImplementationOnce(() => new Promise<Arrivals>((r) => (resolve = r)));
    const { result } = await renderHook(() => useArrivals('83139', { active: true, fetcher }));

    await act(() => result.current.refresh());
    expect(result.current.refreshing).toBe(true);

    await act(async () => resolve(arrivals('83139', 't2')));
    expect(result.current.refreshing).toBe(false);
    expect(result.current.data?.fetchedAt).toBe('t2');
  });

  it('ignores a slow response for a previous stop', async () => {
    let resolveOld!: (value: Arrivals) => void;
    const fetcher = jest.fn((code: string) =>
      code === '11111' ? new Promise<Arrivals>((r) => (resolveOld = r)) : Promise.resolve(arrivals(code)),
    );
    const { result, rerender } = await renderHook((props: { code: string }) =>
      useArrivals(props.code, { active: true, fetcher }),
      { initialProps: { code: '11111' } },
    );

    await rerender({ code: '22222' });
    await act(async () => resolveOld(arrivals('11111')));

    expect(result.current.data?.stopCode).toBe('22222');
  });
});
