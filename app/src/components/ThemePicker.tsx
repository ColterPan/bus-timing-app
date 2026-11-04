import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemePreference } from '../store/ThemeContext';
import { useTheme } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

const OPTIONS: readonly { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'system', label: 'System default', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

interface ThemePickerProps {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const theme = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: theme.card }]} accessibilityRole="radiogroup">
      {OPTIONS.map((option, i) => {
        const checked = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}
            accessibilityRole="radio"
            // aria-* rather than accessibilityState: React Native Web ignores accessibilityState
            aria-checked={checked}
            accessibilityLabel={option.label}
            testID={`theme-${option.value}`}
          >
            <Ionicons name={option.icon} size={20} color={theme.muted} />
            <Text style={[styles.label, { color: theme.text }]}>{option.label}</Text>
            <Ionicons
              name={checked ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={checked ? theme.primary : theme.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  label: { flex: 1, fontSize: 16 },
});
