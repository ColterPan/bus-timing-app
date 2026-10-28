import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { busTypeBadge, formatEta, loadLabel } from '../lib/eta';
import { loadColor, useTheme } from '../theme';
import type { NextBus, ServiceArrival } from '../types';

const SLOTS = 3;

interface Props {
  service: ServiceArrival;
  pinned?: boolean;
  onTogglePin?: () => void;
}

function EtaCell({ bus, primary }: { bus: NextBus | undefined; primary: boolean }) {
  const theme = useTheme();
  const badge = bus ? busTypeBadge(bus.type) : '';
  const label = bus ? `${formatEta(bus.etaMin)}, ${loadLabel(bus.load)}` : 'No bus';

  return (
    <View style={styles.cell} accessibilityLabel={label}>
      <Text
        style={[
          primary ? styles.etaPrimary : styles.eta,
          { color: bus ? loadColor(theme, bus.load) : theme.muted },
        ]}
      >
        {formatEta(bus?.etaMin)}
      </Text>
      <View style={styles.meta}>
        {badge ? <Text style={[styles.badge, { color: theme.muted, borderColor: theme.border }]}>{badge}</Text> : null}
        {bus?.wheelchair ? <Ionicons name="accessibility" size={11} color={theme.muted} /> : null}
        {bus && !bus.monitored ? <Text style={[styles.sched, { color: theme.muted }]}>sched</Text> : null}
      </View>
    </View>
  );
}

export function ArrivalRow({ service, pinned, onTogglePin }: Props) {
  const theme = useTheme();
  const slots = Array.from({ length: SLOTS }, (_, i) => service.next[i]);

  return (
    <View style={[styles.row, { borderColor: theme.border }]} testID={`arrival-row-${service.serviceNo}`}>
      <View style={styles.service}>
        <Text style={[styles.serviceNo, { color: theme.text }]}>{service.serviceNo}</Text>
        <Text style={[styles.operator, { color: theme.muted }]}>{service.operator}</Text>
      </View>
      {slots.map((bus, i) => (
        <EtaCell key={i} bus={bus} primary={i === 0} />
      ))}
      {onTogglePin ? (
        <Pressable
          onPress={onTogglePin}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={pinned ? `Unpin service ${service.serviceNo}` : `Pin service ${service.serviceNo}`}
          testID={`pin-${service.serviceNo}`}
        >
          <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={18} color={pinned ? theme.star : theme.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  service: { width: 64 },
  serviceNo: { fontSize: 22, fontWeight: '700' },
  operator: { fontSize: 11 },
  cell: { flex: 1, alignItems: 'center' },
  etaPrimary: { fontSize: 20, fontWeight: '700' },
  eta: { fontSize: 15, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 14 },
  badge: { fontSize: 9, fontWeight: '700', borderWidth: 1, borderRadius: 3, paddingHorizontal: 2 },
  sched: { fontSize: 9, fontStyle: 'italic' },
});
