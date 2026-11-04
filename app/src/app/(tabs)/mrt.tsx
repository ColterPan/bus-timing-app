import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { HtmlFrame } from '../../components/HtmlFrame';
import { StateView } from '../../components/StateView';
import { LTA_RAIL_NETWORK_URL, MRT_MAP_IMAGE_URL } from '../../lib/links';
import { buildImageViewerHtml } from '../../lib/mapHtml';
import { parseFrameEvent } from '../../lib/mapProtocol';
import { useTheme } from '../../theme';

type Status = 'loading' | 'loaded' | 'error';

export default function MrtScreen() {
  const theme = useTheme();
  const { dark } = theme;
  const html = useMemo(() => buildImageViewerHtml(MRT_MAP_IMAGE_URL, { dark }), [dark]);
  const [status, setStatus] = useState<Status>('loading');

  const onMessage = useCallback((raw: string) => {
    const event = parseFrameEvent(raw);
    if (event?.type === 'image-loaded') setStatus('loaded');
    else if (event?.type === 'image-error') setStatus('error');
  }, []);

  const openLta = () => {
    Linking.openURL(LTA_RAIL_NETWORK_URL).catch(() => undefined);
  };

  return (
    <View style={styles.container}>
      {status === 'error' ? (
        <StateView
          kind="error"
          message="Couldn't load the MRT map. Check your connection, or open the latest map on LTA's website."
          actionLabel="Open LTA website"
          onAction={openLta}
        />
      ) : (
        <View style={styles.container}>
          <HtmlFrame html={html} onMessage={onMessage} title="Singapore MRT and LRT system map" testID="mrt-map" />
          {status === 'loading' ? (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : null}
        </View>
      )}
      <View style={[styles.footer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.hint, { color: theme.muted }]}>Pinch or tap to zoom · Official map © LTA</Text>
        <Pressable onPress={openLta} hitSlop={8} accessibilityRole="link" testID="mrt-lta-link" style={styles.link}>
          <Text style={[styles.linkText, { color: theme.primary }]}>Latest on LTA</Text>
          <Ionicons name="open-outline" size={14} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hint: { fontSize: 12, flexShrink: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 13, fontWeight: '600' },
});
