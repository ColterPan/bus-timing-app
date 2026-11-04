import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NearbyStopItem } from '../../components/NearbyStopItem';
import { StateView } from '../../components/StateView';
import { StopMap } from '../../components/StopMap';
import { useScreenFocused } from '../../hooks/useScreenFocused';
import { useUserLocation } from '../../hooks/useUserLocation';
import { nearestStops } from '../../lib/geo';
import { isFavouriteStop } from '../../store/favourites';
import { useFavourites } from '../../store/FavouritesContext';
import { useStops } from '../../store/StopsContext';
import { useTheme } from '../../theme';

export default function NearbyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const focused = useScreenFocused();
  const { stops, loading: stopsLoading, error: stopsError, retry } = useStops();
  const { favourites, toggleStop } = useFavourites();
  const { state: location, refreshing, refresh } = useUserLocation({ focused });
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [recenterToken, setRecenterToken] = useState(0);

  const position = location.status === 'ready' ? location.position : null;
  const nearby = useMemo(() => (position ? nearestStops(stops, position) : []), [stops, position]);
  const nearestCodes = useMemo(() => nearby.map((n) => n.stop.code), [nearby]);

  const openStop = useCallback((code: string) => router.push({ pathname: '/stop/[code]', params: { code } }), [router]);

  // ⌖ button / pull-to-refresh: get a fresh fix and jump the map back to the user
  const locate = useCallback(async () => {
    await refresh();
    setRecenterToken((t) => t + 1);
  }, [refresh]);

  const renderList = () => {
    if (stopsError && stops.length === 0) {
      return <StateView kind="error" message={stopsError} actionLabel="Try again" onAction={retry} />;
    }
    if (location.status === 'denied') {
      return location.canAskAgain ? (
        <StateView kind="empty" icon="location-outline" message="Allow location access to see bus stops near you." actionLabel="Allow location" onAction={locate} />
      ) : (
        <StateView kind="empty" icon="location-outline" message="Location access is off for this app. Turn it on in Settings to see nearby stops." actionLabel="Open settings" onAction={() => Linking.openSettings()} />
      );
    }
    if (location.status === 'error') {
      return <StateView kind="error" message={location.message} actionLabel="Try again" onAction={locate} />;
    }
    if (location.status === 'locating' || stopsLoading) {
      return <StateView kind="loading" message={stopsLoading ? 'Downloading bus stops…' : 'Finding your location…'} />;
    }

    return (
      <FlatList
        data={nearby}
        keyExtractor={(n) => n.stop.code}
        ListHeaderComponent={
          nearby.length > 0 ? (
            <Text style={[styles.heading, { color: theme.muted }]}>NEAREST BUS STOPS · TAP FOR BUS TIMES</Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <NearbyStopItem
            stop={item.stop}
            distanceM={item.distanceM}
            expanded={expandedCode === item.stop.code}
            active={focused}
            isFavourite={isFavouriteStop(favourites, item.stop.code)}
            onToggleExpand={() => setExpandedCode((c) => (c === item.stop.code ? null : item.stop.code))}
            onToggleFavourite={() => toggleStop(item.stop.code)}
            onOpen={() => openStop(item.stop.code)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={locate} tintColor={theme.primary} />}
        contentContainerStyle={nearby.length === 0 ? styles.fill : styles.listPad}
        ListEmptyComponent={
          <StateView kind="empty" icon="location-outline" message="No bus stops within 500 m. Drag the map to explore, or tap ⌖ to refresh." />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrap, { borderColor: theme.border }]}>
        <StopMap
          stops={stops}
          user={position}
          nearestCodes={nearestCodes}
          recenterToken={recenterToken}
          onSelectStop={openStop}
        />
        <Pressable
          onPress={locate}
          style={[styles.locate, { backgroundColor: theme.card }]}
          accessibilityRole="button"
          accessibilityLabel="Show my location"
          testID="locate-button"
        >
          {refreshing ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Ionicons name="locate" size={24} color={theme.primary} />
          )}
        </Pressable>
      </View>
      <View style={styles.list}>{renderList()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapWrap: { height: '45%', borderBottomWidth: StyleSheet.hairlineWidth },
  locate: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  list: { flex: 1 },
  heading: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginHorizontal: 16, marginTop: 12, marginBottom: 4 },
  fill: { flex: 1 },
  listPad: { paddingBottom: 16 },
});
