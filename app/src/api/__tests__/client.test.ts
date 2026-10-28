import { ApiError, fetchArrivals, fetchStops, getApiUrl } from '../client';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

describe('getApiUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('uses EXPO_PUBLIC_API_URL without a trailing slash', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.5:3000/';
    expect(getApiUrl()).toBe('http://192.168.1.5:3000');
  });

  it('defaults to localhost', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(getApiUrl()).toBe('http://localhost:3000');
  });
});

describe('fetchArrivals', () => {
  it('returns arrivals from the proxy', async () => {
    const body = { stopCode: '83139', fetchedAt: 'x', services: [] };
    const fetchMock = jest.fn().mockReturnValue(json(body));

    expect(await fetchArrivals('83139', fetchMock)).toEqual(body);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/arrivals\/83139$/);
  });

  it("surfaces the server's error message", async () => {
    const fetchMock = jest.fn().mockReturnValue(json({ error: 'Bus stop code must be 5 digits' }, 400));

    await expect(fetchArrivals('1', fetchMock)).rejects.toEqual(new ApiError('Bus stop code must be 5 digits', 400));
  });

  it('gives a generic message when the body is not JSON', async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response('<html>', { status: 503 }));

    await expect(fetchArrivals('83139', fetchMock)).rejects.toThrow('Something went wrong (503)');
  });

  it('gives a friendly message when the network fails', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchArrivals('83139', fetchMock)).rejects.toThrow("Can't reach the bus server");
  });

  it('rejects unexpected response shapes', async () => {
    const fetchMock = jest.fn().mockReturnValue(json({ hello: 'world' }));

    await expect(fetchArrivals('83139', fetchMock)).rejects.toThrow('Unexpected response');
  });
});

describe('fetchStops', () => {
  it('returns the stops array', async () => {
    const fetchMock = jest.fn().mockReturnValue(json({ stops: [['1', 'a', 'b', 1, 2]] }));
    expect(await fetchStops(fetchMock)).toEqual([['1', 'a', 'b', 1, 2]]);
  });

  it('rejects unexpected response shapes', async () => {
    const fetchMock = jest.fn().mockReturnValue(json({}));
    await expect(fetchStops(fetchMock)).rejects.toThrow('Unexpected response');
  });
});
