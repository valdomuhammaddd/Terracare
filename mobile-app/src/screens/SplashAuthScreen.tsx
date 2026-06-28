import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo, ShieldIcon } from '@/components/atoms';
import { authStyles } from '@/constants/auth-theme';
import { AuthForm, SplashOverlay } from '@/components/organisms';

const SPLASH_DURATION_MS = 2200;

export function SplashAuthScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={authStyles.screen}>
      <SplashOverlay visible={showSplash} />

      <SafeAreaView style={authStyles.screen} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={authStyles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={authStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={authStyles.heroGlow} />

            <View style={authStyles.brandBlock}>
              <View className="mb-4 h-20 w-20 items-center justify-center">
                <ShieldIcon size={80} />
              </View>
              <BrandLogo />
            </View>

            <View style={authStyles.card}>
              <AuthForm />
            </View>

            <Text style={authStyles.tagline}>
              Pemantauan kesehatan real-time dan deteksi jatuh untuk orang tersayang — dengan
              presisi IoT dan kehangatan perawatan lansia.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
