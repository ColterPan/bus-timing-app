import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { StateView } from '../../components/StateView';
import { StopCard } from '../../components/StopCard';
import { isStopCode, searchStops } from '../../lib/search';
import { useStops } from '../../store/StopsContext';
import { useTheme } from '../../theme';

const MIN_QUERY_LENGTH = 2;

export default function SearchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { stops, loading, error, retry } = useStops();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed.length >= MIN_QUERY_LENGTH ? searchStops(stops, trimmed) : []),
    [stops, trimmed],
  );

  const openStop = (code: string) => router.push({ pathname: '/stop/[code]', params: { code } });

  // A 5-digit code opens the stop directly, even if it isn't in the downloaded list
  const onSubmit = () => {
    if (isStopCode(trimmed)) openStop(trimmed);
    else if (results.length === 1) openStop(results[0]!.code);
  };

  const renderBody = () => {
    if (error && stops.length === 0 && !isStopCode(trimmed)) {
      return <StateView kind="error" message={error} actionLabel="Try again" onAction={retry} />;
    }
    if (loading) return <StateView kind="loading" message="Downloading bus stops…" />;
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return <StateView kind="empty" icon="search" message="Search by 5-digit stop code, stop name or road." />;
    }
    if (results.length === 0) {
      return (
        <StateView
          kind="empty"
          message={isStopCode(trimmed) ? `Press enter to open stop ${trimmed}.` : `No stops match "${trimmed}".`}
        />
      );
    }
    return (
      <FlatList
        data={results}
        keyExtractor={(s) => s.code}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <StopCard stop={item} onPress={() => openStop(item.code)} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSubmit}
          placeholder="e.g. 83139 or Joo Chiat"
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search bus stops"
          testID="search-input"
        />
      </View>
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
});
