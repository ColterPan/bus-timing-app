import type { BusType, Load } from '../types';

/** BusLah-style label: "Arr" when due, "5 min", or "-" when there is no bus. */
export function formatEta(etaMin: number | undefined): string {
  if (etaMin === undefined) return '-';
  return etaMin <= 0 ? 'Arr' : `${etaMin} min`;
}

const LOAD_LABELS: Record<Load, string> = {
  SEA: 'Seats available',
  SDA: 'Standing available',
  LSD: 'Limited standing',
};

export function loadLabel(load: Load | null): string {
  return load ? LOAD_LABELS[load] : 'Crowd level unknown';
}

const BUS_TYPE_LABELS: Record<BusType, string> = {
  SD: 'Single deck',
  DD: 'Double deck',
  BD: 'Bendy bus',
};

export function busTypeLabel(type: BusType | null): string {
  return type ? BUS_TYPE_LABELS[type] : '';
}

/** Short badge shown next to the ETA; single deck is the default so it gets none. */
export function busTypeBadge(type: BusType | null): string {
  return type === 'DD' || type === 'BD' ? type : '';
}
