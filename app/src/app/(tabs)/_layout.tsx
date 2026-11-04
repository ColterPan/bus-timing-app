import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, type ColorValue } from 'react-native';
import { useTheme } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

const tabIcon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={typeof color === 'string' ? color : undefined} />
  );

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        sceneStyle: { backgroundColor: theme.background },
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={10}
            style={{ marginRight: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            testID="settings-button"
          >
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </Pressable>
        ),
      }}
    >
      {/* Nearby is the home screen: the app opens straight onto stops around you */}
      <Tabs.Screen name="index" options={{ title: 'Nearby', tabBarIcon: tabIcon('navigate') }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favourites', tabBarIcon: tabIcon('star') }} />
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: tabIcon('search') }} />
      <Tabs.Screen name="mrt" options={{ title: 'MRT Map', tabBarIcon: tabIcon('train') }} />
    </Tabs>
  );
}
