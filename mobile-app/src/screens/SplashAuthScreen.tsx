import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo, ShieldIcon } from '@/components/atoms';
import { LoginForm, SplashOverlay } from '@/components/organisms';

const SPLASH_DURATION_MS = 2200;

export function SplashAuthScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return <SplashOverlay visible />;
  }

  return (
    <View className="flex-1 bg-background">
      <SplashOverlay visible={showSplash} />

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-container-margin pb-xl pt-xl"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-xl items-center">
            <View className="mb-md h-20 w-20 items-center justify-center">
              <ShieldIcon size={80} />
            </View>
            <BrandLogo />
          </View>

          <LoginForm />

          <View className="mt-xl px-2">
            <Text className="text-center text-body-lg leading-relaxed text-on-surface-variant">
              Empowering independence through{' '}
              <Text className="font-bold text-primary">Empathetic Precision</Text>. TerraCare
              bridges the gap between high-end IoT sophistication and the warmth of elder care,
              providing real-time vitals monitoring and proactive safety alerts for the people who
              matter most.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
