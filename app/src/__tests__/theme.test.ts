import { BRAND_GREEN, palettes } from '../theme';

/** WCAG 2.x contrast ratio between two #RRGGBB colours. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const AA_TEXT = 4.5;

describe('SG BUS colours', () => {
  it('brand green is the lush green sampled from the buses', () => {
    expect(BRAND_GREEN).toBe('#7AC70C');
  });

  it.each(['light', 'dark'] as const)('%s: accent text is readable on cards and the page', (mode) => {
    const t = palettes[mode];
    expect(contrast(t.primary, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(t.primary, t.background)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it.each(['light', 'dark'] as const)('%s: button text is readable on the accent', (mode) => {
    const t = palettes[mode];
    expect(contrast(t.onPrimary, t.primary)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('dark mode uses the real bus green as its accent', () => {
    expect(palettes.dark.primary).toBe(BRAND_GREEN);
  });

  it.each(['light', 'dark'] as const)('%s: body and muted text stay readable', (mode) => {
    const t = palettes[mode];
    expect(contrast(t.text, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast(t.muted, t.card)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});
