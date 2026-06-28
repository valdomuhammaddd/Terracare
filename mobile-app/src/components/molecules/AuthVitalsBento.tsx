import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';

import { GlassCard } from '@/components/atoms/GlassCard';

function PulseDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={dotStyle}
      className="h-2 w-2 rounded-full bg-primary"
    />
  );
}

function EcgWaveform() {
  return (
    <View className="relative mt-md h-12 w-full overflow-hidden rounded-lg bg-primary/10">
      <View className="absolute inset-0 items-center justify-center opacity-30">
        <Svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
          <Polyline
            points="0,10 10,10 15,2 20,18 25,10 40,10 45,5 50,15 55,10 70,10 75,0 80,20 85,10 100,10"
            fill="none"
            stroke="#006948"
            strokeWidth={2}
          />
        </Svg>
      </View>
    </View>
  );
}

export function AuthVitalsBento() {
  const [heartRate, setHeartRate] = useState(71);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate((current) => {
        const variance = Math.floor(Math.random() * 3) - 1;
        const next = current + variance;
        return Math.min(78, Math.max(68, next));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="w-full gap-md">
      <View className="flex-row gap-md">
        <GlassCard className="flex-1">
          <View className="mb-sm flex-row items-start justify-between">
            <Text className="text-label-md uppercase tracking-wider text-secondary">
              Heart Rate
            </Text>
            <PulseDot />
          </View>
          <View className="flex-row items-baseline gap-xs">
            <Text className="text-[48px] font-bold leading-none tracking-tighter text-on-surface">
              {heartRate}
            </Text>
            <Text className="text-label-md text-secondary">BPM</Text>
          </View>
          <EcgWaveform />
        </GlassCard>

        <GlassCard className="flex-1">
          <View className="mb-sm flex-row items-start justify-between">
            <Text className="text-label-md uppercase tracking-wider text-secondary">
              Rest Level
            </Text>
            <MaterialIcons name="auto-awesome" size={16} color="#006948" />
          </View>
          <View className="flex-row items-baseline gap-xs">
            <Text className="text-[48px] font-bold leading-none tracking-tighter text-on-surface">
              94
            </Text>
            <Text className="text-label-md text-secondary">%</Text>
          </View>
          <View className="mt-md">
            <View className="h-2 w-full rounded-full bg-surface-container-high">
              <View className="h-2 w-[94%] rounded-full bg-primary" />
            </View>
          </View>
        </GlassCard>
      </View>

      <GlassCard className="flex-row items-center justify-between">
        <View className="flex-1 pr-md">
          <Text className="mb-1 text-label-md uppercase tracking-wider text-secondary">
            Status
          </Text>
          <Text className="text-headline-md font-semibold text-primary">Active Monitoring</Text>
          <Text className="text-body-md text-on-surface-variant">Device: Hub-Alpha-01</Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-container">
          <MaterialIcons name="check-circle" size={28} color="#f5fff7" />
        </View>
      </GlassCard>
    </View>
  );
}
