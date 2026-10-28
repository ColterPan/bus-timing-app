import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavouritesProvider } from '../store/FavouritesContext';
import { StopsProvider } from '../store/StopsContext';
import { useTheme } from '../theme';

export default function RootLayout() {
  const theme = useTheme();
  return (
    <StopsProvider>
      <FavouritesProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.card },
            headerTintColor: theme.text,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="stop/[code]" options={{ title: 'Bus stop' }} />
        </Stack>
      </FavouritesProvider>
    </StopsProvider>
  );
}
