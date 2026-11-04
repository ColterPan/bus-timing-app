import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ThemePicker } from '../components/ThemePicker';
import { PRIVACY_POLICY_URL, REPO_URL } from '../lib/links';
import { useThemePreference } from '../store/ThemeContext';
import { useTheme } from '../theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const open = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  const heading = (text: string) => <Text style={[styles.heading, { color: theme.muted }]}>{text}</Text>;
  const link = (label: string, url: string, testID: string) => (
    <Pressable onPress={() => open(url)} style={styles.linkRow} accessibilityRole="link" testID={testID}>
      <Text style={[styles.linkText, { color: theme.primary }]}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={theme.primary} />
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {heading('APPEARANCE')}
      <ThemePicker value={preference} onChange={setPreference} />

      {heading('ABOUT')}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>SG BUS · v{version}</Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Contains information from LTA DataMall, made available under the terms of the Singapore Open Data
          Licence version 1.0. Map tiles © OneMap, Singapore Land Authority. MRT system map © Land Transport
          Authority.
        </Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          This is an independent app and is not affiliated with or endorsed by the Land Transport Authority.
        </Text>
        {link('Privacy policy', PRIVACY_POLICY_URL, 'privacy-link')}
        {link('Source code', REPO_URL, 'source-link')}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  heading: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  card: { marginHorizontal: 12, borderRadius: 12, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 13, lineHeight: 19 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  linkText: { fontSize: 15, fontWeight: '600' },
});
