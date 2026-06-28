import '@/global.css';

import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

import { GlobalOverlays } from '@/components/organisms/GlobalOverlays';
import { AppProviders } from '@/components/providers/AppProviders';
import { useAuthStore } from '@/store/auth-store';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Web or repeated hot reload — safe to ignore.
});

LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  'Remote debugger',
  'Require cycle',
]);

export default function RootLayout() {
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const [fontsLoaded, fontError] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  const isAppReady = isAuthReady && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <AppProviders>
      <GlobalOverlays />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="history" />
      </Stack>
    </AppProviders>
  );
}
