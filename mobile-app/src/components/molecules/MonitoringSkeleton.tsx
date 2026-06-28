import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton, SkeletonLine } from '@/components/atoms/Skeleton';

export function MonitoringSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-container-margin py-base">
        <SkeletonLine width={140} />
        <View className="flex-row gap-2">
          <Skeleton height={40} width={40} className="rounded-full" />
          <Skeleton height={40} width={40} className="rounded-full" />
        </View>
      </View>

      <View className="px-container-margin pt-md">
        <Skeleton height={96} className="mb-lg w-full" />
        <Skeleton height={200} className="mb-gutter w-full" />
        <Skeleton height={120} className="mb-gutter w-full" />
        <View className="mb-gutter flex-row gap-gutter">
          <Skeleton height={120} className="flex-1" />
          <Skeleton height={120} className="flex-1" />
        </View>
        <Skeleton height={56} className="mb-lg w-full rounded-2xl" />
        <SkeletonLine width={160} className="mb-md" />
        <Skeleton height={72} className="mb-sm w-full" />
        <Skeleton height={72} className="w-full" />
      </View>
    </View>
  );
}
