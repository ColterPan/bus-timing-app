import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { BusStop } from '../types';

interface Props {
  stop: BusStop;
  distance?: string;
  onPress: () => void;
}

export function StopCard({ stop, distance, onPress }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }]}
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
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    gap: 8,
  },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  distance: { fontSize: 13, fontWeight: '600' },
});
