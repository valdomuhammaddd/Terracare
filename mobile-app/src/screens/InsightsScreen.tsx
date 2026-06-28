import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { AppHeader } from '@/components/organisms/AppHeader';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton, SkeletonLine } from '@/components/atoms/Skeleton';
import { supabase } from '@/lib/supabase';
import type { VitalLog } from '@/types/supabase';
import { hapticLight } from '@/utils/haptics';
import { shouldUseMockFallback } from '@/constants/demo-config';
import { MockDataService } from '@/services/MockDataService';

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function InsightsSkeleton() {
  return (
    <View className="gap-gutter">
      <View className="flex-row gap-gutter">
        <Skeleton height={140} className="flex-1" />
        <Skeleton height={140} className="flex-1" />
      </View>
      <SkeletonLine width={160} className="mb-md" />
      <Skeleton height={88} className="w-full" />
      <Skeleton height={88} className="w-full" />
    </View>
  );
}

export function InsightsScreen() {
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileName, setProfileName] = useState<string>();

  const loadData = useCallback(async (pull = false) => {
    if (pull) setIsRefreshing(true);
    else setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setVitals([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileRow) setProfileName((profileRow as { full_name: string }).full_name);

    const { data, error } = await supabase
      .from('vital_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(30);

    const rows = (data ?? []) as VitalLog[];
    const useMock = shouldUseMockFallback({ isEmpty: rows.length === 0 }) || Boolean(error);
    setVitals(useMock ? MockDataService.getInsightVitals(user.id) : rows);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const hrValues = vitals.map((v) => v.heart_rate_bpm);
  const spo2Values = vitals.map((v) => v.spo2_percent);
  const avgHr = average(hrValues);
  const avgSpo2 = average(spo2Values);
  const hasData = vitals.length > 0;

  return (
    <View className="flex-1 bg-background">
      <AppHeader profileName={profileName} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-margin pb-36 pt-md"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void hapticLight();
              void loadData(true);
            }}
            tintColor="#006948"
          />
        }
      >
        <Text className="mb-md text-headline-lg-mobile font-bold text-on-surface">Care Insights</Text>

        {isLoading ? (
          <InsightsSkeleton />
        ) : !hasData ? (
          <EmptyState
            actionLabel="Muat Ulang Data"
            onAction={() => void loadData(true)}
          />
        ) : (
          <>
            <View className="mb-gutter flex-row gap-gutter">
              <View className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
                <Text className="text-label-md uppercase tracking-widest text-secondary">Heart Rate</Text>
                <Text
                  className="mt-1 text-vitals-display font-extrabold text-primary"
                  accessibilityLabel={`Rata-rata detak jantung ${avgHr ?? 'belum tersedia'} BPM`}
                >
                  {avgHr ?? '--'}
                </Text>
                <Text className="text-label-md font-semibold text-secondary">BPM rata-rata</Text>
                <Text className="mt-2 text-xs text-on-surface-variant">{vitals.length} sampel</Text>
              </View>
              <View className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
                <Text className="text-label-md uppercase tracking-widest text-secondary">SpO₂</Text>
                <Text
                  className="mt-1 text-vitals-display font-extrabold text-on-surface"
                  accessibilityLabel={`Rata-rata SpO2 ${avgSpo2 ?? 'belum tersedia'} persen`}
                >
                  {avgSpo2 ?? '--'}
                </Text>
                <Text className="text-label-md font-semibold text-secondary">% rata-rata</Text>
                <Text className="mt-2 text-xs text-on-surface-variant">Optimal 95–100%</Text>
              </View>
            </View>

            <Text className="mb-md text-headline-md font-semibold text-on-surface">Insight Kesehatan</Text>

            <View className="mb-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
              <Text className="mb-sm text-label-md uppercase tracking-widest text-secondary">
                Tren 24 Jam
              </Text>
              <View className="h-20 flex-row items-end justify-between gap-1">
                {MockDataService.getInsightChartBars().map((h, index) => (
                  <View
                    key={index}
                    className="flex-1 rounded-t bg-primary"
                    style={{ height: `${h * 100}%`, opacity: 0.35 + h * 0.55 }}
                  />
                ))}
              </View>
            </View>

            <View className="mb-sm flex-row items-center gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MaterialIcons name="lightbulb-outline" size={24} color="#006948" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-on-surface">Hidrasi & Istirahat</Text>
                <Text className="text-body-md text-secondary">
                  {avgHr && avgHr > 85
                    ? 'Detak jantung sedikit tinggi. Pastikan cukup minum dan istirahat.'
                    : 'Vital sign dalam rentang normal. Pertahankan pola hidup sehat.'}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                <MaterialIcons name="medical-information" size={24} color="#545f73" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-on-surface">Pemantauan Aktif</Text>
                <Text className="text-body-md text-secondary">
                  Data terakhir:{' '}
                  {new Date(vitals[0].recorded_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
