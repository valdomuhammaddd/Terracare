import { StyleSheet, View } from 'react-native';

import { Skeleton, SkeletonLine } from '@/components/atoms/Skeleton';

interface MonitoringSkeletonProps {
  hideHeader?: boolean;
}

export function MonitoringSkeleton({ hideHeader = false }: MonitoringSkeletonProps) {
  return (
    <View style={styles.body}>
      {!hideHeader ? (
        <View style={styles.headerRow}>
          <SkeletonLine width={140} />
          <View style={styles.headerActions}>
            <Skeleton height={40} width={40} className="rounded-full" />
            <Skeleton height={40} width={40} className="rounded-full" />
          </View>
        </View>
      ) : null}

      <View style={styles.content}>
        <Skeleton height={96} className="mb-lg w-full" />
        <Skeleton height={200} className="mb-gutter w-full" />
        <Skeleton height={120} className="mb-gutter w-full" />
        <View style={styles.row}>
          <Skeleton height={120} className="flex-1" />
          <Skeleton height={120} className="flex-1" />
        </View>
        <Skeleton height={56} className="mb-lg mt-gutter w-full rounded-2xl" />
        <SkeletonLine width={160} className="mb-md" />
        <Skeleton height={72} className="mb-sm w-full" />
        <Skeleton height={72} className="w-full" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#f5fff7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
});
