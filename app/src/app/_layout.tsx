import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavouritesProvider } from '../store/FavouritesContext';
import { StopsProvider } from '../store/StopsContext';
import { ThemeProvider } from '../store/ThemeContext';
import { useTheme } from '../theme';

function AppStack() {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {/* Title gives the back arrow a readable label ("Home, back") for screen readers */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="stop/[code]" options={{ title: 'Bus stop' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StopsProvider>
        <FavouritesProvider>
          <AppStack />
        </FavouritesProvider>
      </StopsProvider>
    </ThemeProvider>
  );
}
