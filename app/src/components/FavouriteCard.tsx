import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useArrivals } from '../hooks/useArrivals';
import { useFavourites } from '../store/FavouritesContext';
import { visibleServices } from '../store/favourites';
import { useStops } from '../store/StopsContext';
import { useTheme } from '../theme';
import type { Favourite } from '../types';
import { ArrivalRow } from './ArrivalRow';

interface Props {
  favourite: Favourite;
  active: boolean;
}

export function FavouriteCard({ favourite, active }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { byCode } = useStops();
  const { toggleStop } = useFavourites();
  const { data, error, loading } = useArrivals(favourite.stopCode, { active });
  const stop = byCode.get(favourite.stopCode);
  const services = data ? visibleServices(favourite, data.services) : [];

  return (
    <View style={[styles.card, { backgroundColor: theme.card }]} testID={`fav-${favourite.stopCode}`}>
      {/* Siblings, not nested: a button inside a button is invalid on web */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerText}
          onPress={() => router.push({ pathname: '/stop/[code]', params: { code: favourite.stopCode } })}
          accessibilityRole="button"
        >
          <Text style={[styles.name, { color: theme.text }]}>{stop?.name ?? `Stop ${favourite.stopCode}`}</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            {favourite.stopCode}
            {stop ? ` · ${stop.road}` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => toggleStop(favourite.stopCode)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Remove from favourites"
        >
          <Ionicons name="star" size={22} color={theme.star} />
        </Pressable>
      </View>

      {loading && !data ? <ActivityIndicator style={styles.pad} color={theme.primary} /> : null}
      {error ? <Text style={[styles.pad, styles.error, { color: theme.danger }]}>{error}</Text> : null}
      {data && services.length === 0 ? (
        <Text style={[styles.pad, { color: theme.muted }]}>No buses right now.</Text>
      ) : null}
      {services.map((s) => (
        <ArrivalRow key={s.serviceNo} service={s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginVertical: 6, borderRadius: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  headerText: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  pad: { padding: 14 },
  error: { fontSize: 13 },
});
