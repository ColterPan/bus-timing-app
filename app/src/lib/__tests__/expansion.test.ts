import { EMPTY_EXPANSION, isExpanded, toggleExpanded } from '../expansion';

describe('nearby stop expansion', () => {
  it('opens the closest stop by default and nothing else', () => {
    expect(isExpanded(EMPTY_EXPANSION, 'A', 'A')).toBe(true);
    expect(isExpanded(EMPTY_EXPANSION, 'B', 'A')).toBe(false);
  });

  it('nothing is open when there is no closest stop yet', () => {
    expect(isExpanded(EMPTY_EXPANSION, 'A', null)).toBe(false);
  });

  it('lets the user collapse the closest stop', () => {
    const state = toggleExpanded(EMPTY_EXPANSION, 'A', 'A');
    expect(isExpanded(state, 'A', 'A')).toBe(false);
    expect(isExpanded(toggleExpanded(state, 'A', 'A'), 'A', 'A')).toBe(true);
  });

  it('keeps several stops open at once', () => {
    const state = toggleExpanded(toggleExpanded(EMPTY_EXPANSION, 'B', 'A'), 'C', 'A');
    expect(['A', 'B', 'C'].map((c) => isExpanded(state, c, 'A'))).toEqual([true, true, true]);
  });

  it('auto-opens a new closest stop after the user moves', () => {
    const state = toggleExpanded(EMPTY_EXPANSION, 'A', 'A'); // collapsed old closest
    expect(isExpanded(state, 'B', 'B')).toBe(true);
    expect(isExpanded(state, 'A', 'B')).toBe(false);
  });

  it('does not mutate the previous state', () => {
    const before = toggleExpanded(EMPTY_EXPANSION, 'B', 'A');
    toggleExpanded(before, 'C', 'A');
    expect([...before.opened]).toEqual(['B']);
    expect(EMPTY_EXPANSION.opened.size).toBe(0);
  });
});
