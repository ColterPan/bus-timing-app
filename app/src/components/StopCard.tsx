import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { BusStop } from '../types';

interface Props {
  stop: BusStop;
  distance?: string;
  onPress: () => void;
  /** Pass both to show a favourite star. */
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
}

export function StopCard({ stop, distance, onPress, isFavourite = false, onToggleFavourite }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      {/* Siblings, not nested: a button inside a button is invalid on web */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${stop.name}, ${stop.road}, stop ${stop.code}${distance ? `, ${distance} away` : ''}`}
        testID={`stop-${stop.code}`}
      >
        <View style={styles.text}>
          <Text style={[styles.name, { color: theme.text }]}>{stop.name}</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            {stop.code} · {stop.road}
          </Text>
        </View>
        {distance ? <Text style={[styles.distance, { color: theme.primary }]}>{distance}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      </Pressable>
      {onToggleFavourite ? (
        <Pressable
          onPress={onToggleFavourite}
          hitSlop={10}
          style={styles.star}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? `Remove ${stop.name} from favourites` : `Add ${stop.name} to favourites`}
          testID={`star-${stop.code}`}
        >
          <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={22} color={isFavourite ? theme.star : theme.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  distance: { fontSize: 13, fontWeight: '600' },
  star: { paddingRight: 14 },
});
