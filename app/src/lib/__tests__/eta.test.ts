import { busTypeBadge, busTypeLabel, formatEta, loadLabel } from '../eta';

describe('formatEta', () => {
  it('shows "Arr" when the bus is due', () => {
    expect(formatEta(0)).toBe('Arr');
  });

  it('shows minutes otherwise', () => {
    expect(formatEta(1)).toBe('1 min');
    expect(formatEta(12)).toBe('12 min');
  });

  it('shows "-" when there is no bus', () => {
    expect(formatEta(undefined)).toBe('-');
  });

  it('treats negative values as arriving', () => {
    expect(formatEta(-1)).toBe('Arr');
  });
});

describe('labels', () => {
  it('describes crowd levels', () => {
    expect(loadLabel('SEA')).toBe('Seats available');
    expect(loadLabel('SDA')).toBe('Standing available');
    expect(loadLabel('LSD')).toBe('Limited standing');
    expect(loadLabel(null)).toBe('Crowd level unknown');
  });

  it('describes bus types', () => {
    expect(busTypeLabel('DD')).toBe('Double deck');
    expect(busTypeLabel('SD')).toBe('Single deck');
    expect(busTypeLabel('BD')).toBe('Bendy bus');
    expect(busTypeLabel(null)).toBe('');
  });

  it('only badges double-deck and bendy buses', () => {
    expect(busTypeBadge('DD')).toBe('DD');
    expect(busTypeBadge('BD')).toBe('BD');
    expect(busTypeBadge('SD')).toBe('');
    expect(busTypeBadge(null)).toBe('');
  });
});
