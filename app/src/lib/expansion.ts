/**
 * Which nearby stops show their bus times. The closest stop is open by default (so times show
 * the moment the app opens); any stop can be opened or closed, and several can be open at once.
 */
export interface ExpansionState {
  opened: ReadonlySet<string>;
  collapsed: ReadonlySet<string>;
}

export const EMPTY_EXPANSION: ExpansionState = { opened: new Set(), collapsed: new Set() };

export function isExpanded(state: ExpansionState, code: string, closestCode: string | null): boolean {
  if (state.opened.has(code)) return true;
  return code === closestCode && !state.collapsed.has(code);
}

export function toggleExpanded(state: ExpansionState, code: string, closestCode: string | null): ExpansionState {
  const opened = new Set(state.opened);
  const collapsed = new Set(state.collapsed);
  if (isExpanded(state, code, closestCode)) {
    opened.delete(code);
    collapsed.add(code);
  } else {
    opened.add(code);
    collapsed.delete(code);
  }
  return { opened, collapsed };
}
