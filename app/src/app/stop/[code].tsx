import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ArrivalRow } from '../../components/ArrivalRow';
import { StateView } from '../../components/StateView';
import { useArrivals } from '../../hooks/useArrivals';
import { useScreenFocused } from '../../hooks/useScreenFocused';
import { isStopCode } from '../../lib/search';
import { useFavourites } from '../../store/FavouritesContext';
import { isFavouriteStop, isPinnedService } from '../../store/favourites';
import { useStops } from '../../store/StopsContext';
import { useTheme } from '../../theme';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function StopScreen() {
  const { code = '' } = useLocalSearchParams<{ code: string }>();
  const theme = useTheme();
  const focused = useScreenFocused();
  const { byCode } = useStops();
  const { favourites, toggleStop, toggleService } = useFavourites();
  const { data, error, loading, refreshing, refresh } = useArrivals(code, { active: focused && isStopCode(code) });

  const stop = byCode.get(code);
  const isFav = isFavouriteStop(favourites, code);

  const header = (
    <Stack.Screen
      options={{
        title: stop?.name ?? `Stop ${code}`,
        headerRight: () => (
          <Pressable
            onPress={() => toggleStop(code)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
            testID="favourite-toggle"
          >
            <Ionicons name={isFav ? 'star' : 'star-outline'} size={24} color={isFav ? theme.star : theme.text} />
          </Pressable>
        ),
      }}
    />
  );

  if (!isStopCode(code)) {
    return <StateView kind="error" message={`"${code}" is not a valid bus stop code.`} />;
  }
  if (loading && !data) {
    return (
      <>
        {header}
        <StateView kind="loading" />
      </>
    );
  }
  if (error && !data) {
    return (
      <>
        {header}
        <StateView kind="error" message={error} actionLabel="Try again" onAction={refresh} />
      </>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <View style={[styles.info, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.infoText, { color: theme.muted }]}>
          {code}
          {stop ? ` · ${stop.road}` : ''}
          {data ? ` · Updated ${formatTime(data.fetchedAt)}` : ''}
        </Text>
        {error ? <Text style={[styles.infoText, { color: theme.danger }]}>{error}</Text> : null}
      </View>
      <FlatList
        data={data?.services ?? []}
        keyExtractor={(s) => s.serviceNo}
        renderItem={({ item }) => (
          <ArrivalRow
            service={item}
            pinned={isPinnedService(favourites, code, item.serviceNo)}
            onTogglePin={() => toggleService(code, item.serviceNo)}
          />
        )}
        style={{ backgroundColor: theme.card }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}
        contentContainerStyle={data?.services.length ? undefined : { flex: 1 }}
        ListEmptyComponent={
          <StateView kind="empty" message="No buses are serving this stop right now (it may be late night)." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  info: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  infoText: { fontSize: 12 },
});
