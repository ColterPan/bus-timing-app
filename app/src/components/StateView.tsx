import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  kind: 'loading' | 'error' | 'empty';
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full-screen loading / error / empty placeholder. */
export function StateView({ kind, message, icon, actionLabel, onAction }: Props) {
  const theme = useTheme();
  const defaultIcon = kind === 'error' ? 'cloud-offline-outline' : 'bus-outline';

  return (
    <View style={styles.container} testID={`state-${kind}`}>
      {kind === 'loading' ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <Ionicons name={icon ?? defaultIcon} size={48} color={kind === 'error' ? theme.danger : theme.muted} />
      )}
      {message ? <Text style={[styles.message, { color: theme.muted }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={[styles.button, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  button: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
});
