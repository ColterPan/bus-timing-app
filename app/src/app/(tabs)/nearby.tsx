import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl } from 'react-native';
import { StateView } from '../../components/StateView';
import { StopCard } from '../../components/StopCard';
import { formatDistance, nearestStops, type LatLng } from '../../lib/geo';
import { useStops } from '../../store/StopsContext';
import { useTheme } from '../../theme';

type LocationState =
  | { status: 'locating' }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'error'; message: string }
  | { status: 'ready'; position: LatLng };

export default function NearbyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { stops, loading: stopsLoading, error: stopsError, retry } = useStops();
  const [location, setLocation] = useState<LocationState>({ status: 'locating' });
  const [refreshing, setRefreshing] = useState(false);

  const locate = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocation({ status: 'denied', canAskAgain: permission.canAskAgain });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ status: 'ready', position: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
    } catch {
      setLocation({ status: 'error', message: "Couldn't get your location. Is location turned on?" });
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await locate();
    setRefreshing(false);
  }, [locate]);

  const nearby = useMemo(
    () => (location.status === 'ready' ? nearestStops(stops, location.position) : []),
    [stops, location],
  );

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
      renderItem={({ item }) => (
        <StopCard
          stop={item.stop}
          distance={formatDistance(item.distanceM)}
          onPress={() => router.push({ pathname: '/stop/[code]', params: { code: item.stop.code } })}
        />
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      contentContainerStyle={nearby.length === 0 ? { flex: 1 } : { paddingVertical: 8 }}
      ListEmptyComponent={
        <StateView kind="empty" icon="location-outline" message="No bus stops within 500 m. Pull down to refresh." />
      }
    />
  );
}
