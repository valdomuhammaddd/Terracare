import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { EmergencyOverlay } from '@/components/organisms/EmergencyOverlay';

export default function RootLayout() {
  return (
    <>
      <EmergencyOverlay />
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
