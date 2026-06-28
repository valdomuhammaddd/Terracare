import { View } from 'react-native';

import { Skeleton, SkeletonLine } from '@/components/atoms/Skeleton';

export function ActivityListSkeleton() {
  return (
    <View className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      {Array.from({ length: 6 }).map((_, index) => (
        <View
          key={index}
          className="flex-row items-center border-b border-outline-variant/40 px-3 py-4"
        >
          <Skeleton height={36} width={36} className="mr-4 rounded-full" />
          <View className="flex-1 gap-2">
            <SkeletonLine width="55%" />
            <SkeletonLine width="40%" />
          </View>
          <View className="items-end gap-2">
            <SkeletonLine width={48} />
            <SkeletonLine width={36} />
          </View>
        </View>
      ))}
    </View>
  );
}
