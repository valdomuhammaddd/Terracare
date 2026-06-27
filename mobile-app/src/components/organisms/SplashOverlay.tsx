import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { BrandLogo, ShieldIcon } from '@/components/atoms';

interface SplashOverlayProps {
  visible: boolean;
}

export function SplashOverlay({ visible }: SplashOverlayProps) {
  const opacity = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 400 });
    } else {
      opacity.value = 1;
    }
  }, [visible, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={containerStyle}
      className="absolute inset-0 z-50 items-center justify-center bg-black"
    >
      <Animated.View style={iconStyle}>
        <ShieldIcon size={120} />
      </Animated.View>
      <View className="mt-md">
        <BrandLogo size="lg" />
      </View>
    </Animated.View>
  );
}
