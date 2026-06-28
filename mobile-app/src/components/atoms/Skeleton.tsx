import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps extends ViewProps {
  className?: string;
  height?: number;
  width?: number | `${number}%`;
}

export function Skeleton({ className, height, width, style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[pulseStyle, { height, width }, style]}
      className={`rounded-xl bg-surface-container-high ${className ?? ''}`}
      {...props}
    />
  );
}

export function SkeletonLine({ width = '100%' as const, className }: { width?: number | `${number}%`; className?: string }) {
  return <Skeleton height={14} width={width} className={`rounded-md ${className ?? ''}`} />;
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      height={size}
      width={size}
      className={`rounded-full ${className ?? ''}`}
    />
  );
}
