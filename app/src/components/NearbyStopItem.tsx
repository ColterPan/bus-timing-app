import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useArrivals } from '../hooks/useArrivals';
import { formatDistance } from '../lib/geo';
import { useTheme } from '../theme';
import type { BusStop } from '../types';
import { ArrivalRow } from './ArrivalRow';

interface NearbyStopItemProps {
  stop: BusStop;
  distanceM: number;
  expanded: boolean;
  /** Whether the screen is visible; arrivals only poll while expanded and active. */
  active: boolean;
  isFavourite: boolean;
  onToggleExpand: () => void;
  onToggleFavourite: () => void;
  onOpen: () => void;
}

/** A nearby stop that expands like a dropdown to show its live bus times. */
export function NearbyStopItem({
  stop,
  distanceM,
  expanded,
  active,
  isFavourite,
  onToggleExpand,
  onToggleFavourite,
  onOpen,
}: NearbyStopItemProps) {
  const theme = useTheme();
  const { data, error, loading } = useArrivals(stop.code, { active: expanded && active });
  const distance = formatDistance(distanceM);

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]} testID={`nearby-${stop.code}`}>
      {/* Siblings, not nested: a button inside a button is invalid on web */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerMain}
          onPress={onToggleExpand}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${stop.name}, ${distance} away, ${expanded ? 'hide' : 'show'} bus times`}
          testID={`nearby-toggle-${stop.code}`}
        >
          <View style={styles.text}>
            <Text style={[styles.name, { color: theme.text }]}>{stop.name}</Text>
            <Text style={[styles.sub, { color: theme.muted }]}>
              {stop.code} · {stop.road}
            </Text>
          </View>
          <Text style={[styles.distance, { color: theme.primary }]}>{distance}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.muted} />
        </Pressable>
        <Pressable
          onPress={onToggleFavourite}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? `Remove ${stop.name} from favourites` : `Add ${stop.name} to favourites`}
          testID={`nearby-star-${stop.code}`}
        >
          <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={22} color={isFavourite ? theme.star : theme.muted} />
        </Pressable>
      </View>

      {expanded ? (
        <View style={[styles.body, { borderColor: theme.border }]}>
          {loading && !data ? <ActivityIndicator style={styles.pad} color={theme.primary} /> : null}
          {error ? <Text style={[styles.pad, styles.small, { color: theme.danger }]}>{error}</Text> : null}
          {data && data.services.length === 0 ? (
            <Text style={[styles.pad, { color: theme.muted }]}>No buses right now.</Text>
          ) : null}
          {data?.services.map((s) => <ArrivalRow key={s.serviceNo} service={s} />)}
          <Pressable
            style={styles.open}
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel={`Open stop ${stop.code}`}
            testID={`nearby-open-${stop.code}`}
          >
            <Text style={[styles.openText, { color: theme.primary }]}>Open stop page</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 4, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingRight: 14 },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  distance: { fontSize: 13, fontWeight: '600' },
  body: { borderTopWidth: StyleSheet.hairlineWidth },
  pad: { padding: 14 },
  small: { fontSize: 13 },
  open: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 },
  openText: { fontSize: 14, fontWeight: '600' },
});
