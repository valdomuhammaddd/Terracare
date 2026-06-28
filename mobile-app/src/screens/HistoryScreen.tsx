import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/organisms/AppHeader';
import { ActivityListSkeleton } from '@/components/molecules/ActivityListSkeleton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { supabase } from '@/lib/supabase';
import type { EmergencyEvent, HandledStatus, VitalLog } from '@/types/supabase';
import { hapticLight } from '@/utils/haptics';
import { shouldUseMockFallback } from '@/constants/demo-config';
import { MockDataService } from '@/services/MockDataService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HistoryItemKind = 'emergency' | 'vital';

type StatusVariant = 'safe' | 'handled' | 'pending';

interface HistoryItem {
  id: string;
  kind: HistoryItemKind;
  timestamp: string;
  title: string;
  subtitle: string;
  heartRateBpm: number | null;
  spo2Percent: number | null;
  statusLabel: string;
  statusVariant: StatusVariant;
}

const HISTORY_LIMIT = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHistorySubtitle(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return `Hari ini, ${time} WIB`;
  if (isYesterday) return `Kemarin, ${time} WIB`;

  const dateLabel = date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${dateLabel}, ${time} WIB`;
}

function emergencyTitle(event: EmergencyEvent): string {
  if (event.fall_type === 'hard') return 'Fall Detection';
  return 'Fall Detection';
}

function emergencyStatus(handledStatus: HandledStatus): {
  label: string;
  variant: StatusVariant;
} {
  if (handledStatus === 'pending') {
    return { label: 'Menunggu', variant: 'pending' };
  }
  return { label: 'Ditangani', variant: 'handled' };
}

function findPostEventVital(event: EmergencyEvent, vitals: VitalLog[]): VitalLog | null {
  const eventTime = new Date(event.triggered_at).getTime();

  const candidates = vitals
    .filter((v) => v.device_id === event.device_id)
    .filter((v) => new Date(v.recorded_at).getTime() >= eventTime - 60_000)
    .sort(
      (a, b) =>
        Math.abs(new Date(a.recorded_at).getTime() - eventTime) -
        Math.abs(new Date(b.recorded_at).getTime() - eventTime),
    );

  return candidates[0] ?? null;
}

function mapEmergencyToHistory(event: EmergencyEvent, vitals: VitalLog[]): HistoryItem {
  const relatedVital = findPostEventVital(event, vitals);
  const status = emergencyStatus(event.handled_status);

  return {
    id: `emergency-${event.id}`,
    kind: 'emergency',
    timestamp: event.triggered_at,
    title: emergencyTitle(event),
    subtitle: formatHistorySubtitle(event.triggered_at),
    heartRateBpm: relatedVital?.heart_rate_bpm ?? null,
    spo2Percent: relatedVital?.spo2_percent ?? null,
    statusLabel: status.label,
    statusVariant: status.variant,
  };
}

function mapVitalToHistory(vital: VitalLog): HistoryItem {
  const isLowSpo2 = vital.spo2_percent < 92;
  return {
    id: `vital-${vital.id}`,
    kind: 'vital',
    timestamp: vital.recorded_at,
    title: isLowSpo2 ? 'SpO2' : 'Heart Rate',
    subtitle: formatHistorySubtitle(vital.recorded_at),
    heartRateBpm: vital.heart_rate_bpm,
    spo2Percent: vital.spo2_percent,
    statusLabel: isLowSpo2 ? 'Perhatian' : 'Aman',
    statusVariant: isLowSpo2 ? 'pending' : 'safe',
  };
}

function mergeHistoryItems(
  emergencies: EmergencyEvent[],
  vitals: VitalLog[],
): HistoryItem[] {
  const emergencyItems = emergencies.map((event) => mapEmergencyToHistory(event, vitals));
  const vitalItems = vitals.map(mapVitalToHistory);

  return [...emergencyItems, ...vitalItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, HISTORY_LIMIT);
}

async function fetchHistoryForUser(userId: string): Promise<HistoryItem[]> {
  const [emergenciesRes, vitalsRes] = await Promise.all([
    supabase
      .from('emergency_events')
      .select('*')
      .eq('user_id', userId)
      .order('triggered_at', { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase
      .from('vital_logs')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);

  if (emergenciesRes.error) {
    throw new Error(emergenciesRes.error.message);
  }
  if (vitalsRes.error) {
    throw new Error(vitalsRes.error.message);
  }

  const emergencies = (emergenciesRes.data ?? []) as EmergencyEvent[];
  const vitals = (vitalsRes.data ?? []) as VitalLog[];

  return mergeHistoryItems(emergencies, vitals);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
}

function StatusBadge({ label, variant }: StatusBadgeProps) {
  const className =
    variant === 'safe'
      ? 'bg-primary-container'
      : variant === 'handled'
        ? 'bg-surface-container-high'
        : 'bg-error-container';

  const textClass =
    variant === 'safe'
      ? 'text-on-primary-container'
      : variant === 'handled'
        ? 'text-on-surface-variant'
        : 'text-on-error-container';

  return (
    <View className={`rounded-full px-2 py-0.5 ${className}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wide ${textClass}`}>
        {label}
      </Text>
    </View>
  );
}

interface HistoryCardProps {
  item: HistoryItem;
}

function HistoryCard({ item }: HistoryCardProps) {
  const isEmergency = item.kind === 'emergency';
  const isHighAlert =
    isEmergency ||
    (item.heartRateBpm !== null && item.heartRateBpm > 100) ||
    (item.spo2Percent !== null && item.spo2Percent < 92);

  const iconBg = isHighAlert ? 'bg-rose-50' : 'bg-emerald-50';
  const iconName = isEmergency
    ? 'warning'
    : item.spo2Percent !== null && item.title === 'SpO2'
      ? 'opacity'
      : 'favorite';
  const iconColor = isHighAlert ? '#ba1a1a' : '#006948';

  const valueText =
    isEmergency
      ? 'Terdeteksi'
      : item.heartRateBpm !== null && item.title.includes('Jantung')
        ? `${item.heartRateBpm} BPM`
        : item.spo2Percent !== null
          ? `${item.spo2Percent}%`
          : item.heartRateBpm !== null
            ? `${item.heartRateBpm} BPM`
            : '--';

  const statusText = isEmergency
    ? 'CRITICAL'
    : isHighAlert
      ? 'HIGH ALERT'
      : item.statusVariant === 'safe'
        ? 'OPTIMAL'
        : 'STABLE';

  return (
    <View
      className={`flex-row items-center border-b border-slate-100 px-3 py-4 ${
        isEmergency ? 'bg-rose-50/30' : ''
      }`}
    >
      <View className={`mr-4 h-9 w-9 items-center justify-center rounded-full ${iconBg}`}>
        <MaterialIcons name={iconName as keyof typeof MaterialIcons.glyphMap} size={20} color={iconColor} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-slate-800">{item.title}</Text>
        <Text className="text-xs text-slate-400">{item.subtitle}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-base font-bold ${isHighAlert ? 'text-rose-600' : 'text-slate-900'}`}>
          {valueText}
        </Text>
        <Text
          className={`text-[10px] font-bold uppercase tracking-tighter ${
            isHighAlert ? 'text-rose-600' : 'text-primary'
          }`}
        >
          {statusText}
        </Text>
      </View>
    </View>
  );
}

function EmptyHistoryState() {
  return (
    <View className="py-lg">
      <EmptyState />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type HistoryFilter = 'all' | 'emergency' | 'vital';

interface HistoryScreenProps {
  embedded?: boolean;
}

export function HistoryScreen({ embedded = false }: HistoryScreenProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setItems([]);
        return;
      }

      const history = await fetchHistoryForUser(user.id);
      const useMock = shouldUseMockFallback({ isEmpty: history.length === 0 });
      setItems(useMock ? MockDataService.getHistoryEntries() : history);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat riwayat';
      if (shouldUseMockFallback({ isEmpty: true })) {
        setItems(MockDataService.getHistoryEntries());
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredItems = items.filter((item) => {
    if (filter === 'emergency') return item.kind === 'emergency';
    if (filter === 'vital') return item.kind === 'vital';
    return true;
  });

  const cycleFilter = () => {
    void hapticLight();
    setFilter((prev) => (prev === 'all' ? 'emergency' : prev === 'emergency' ? 'vital' : 'all'));
  };

  const filterLabel =
    filter === 'all' ? 'Semua' : filter === 'emergency' ? 'Darurat' : 'Vital';

  if (isLoading && items.length === 0) {
    return (
      <View className="flex-1 bg-background">
        {embedded ? <AppHeader /> : null}
        <View className="px-container-margin pt-md">
          {embedded ? (
            <Text className="mb-4 text-headline-lg-mobile font-bold text-on-surface">
              Riwayat Detail
            </Text>
          ) : null}
          <ActivityListSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {embedded ? (
        <AppHeader />
      ) : (
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-4 bg-surface px-container-margin py-4">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-container-high"
            >
              <MaterialIcons name="arrow-back" size={22} color="#006948" />
            </Pressable>
            <Text className="text-headline-lg-mobile font-black text-primary">Riwayat Detail</Text>
          </View>
        </SafeAreaView>
      )}

      <View className="flex-1">
        <View className="flex-row items-center justify-between px-container-margin py-6">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-primary" />
            <Text className="text-label-md uppercase tracking-widest text-outline">Real-Time Log</Text>
          </View>
          <Pressable
            onPress={cycleFilter}
            className="flex-row items-center gap-1 rounded-full px-3 py-1 active:bg-primary-container/10"
          >
            <MaterialIcons name="filter-list" size={18} color="#006948" />
            <Text className="text-sm font-semibold text-primary">Filter ({filterLabel})</Text>
          </Pressable>
        </View>

        {isLoading && items.length === 0 ? null : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HistoryCard item={item} />}
            contentContainerClassName="grow px-container-margin pb-36"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void loadHistory(true)}
                tintColor="#006948"
                colors={['#006948']}
              />
            }
            ListHeaderComponent={
              embedded ? (
                <Text className="mb-4 text-headline-lg-mobile font-bold text-on-surface">
                  Riwayat Detail
                </Text>
              ) : null
            }
            ListEmptyComponent={
              error ? (
                <View className="mt-xl items-center px-md">
                  <MaterialIcons name="error-outline" size={48} color="#ba1a1a" />
                  <Text className="mt-md text-center text-body-md text-error">{error}</Text>
                </View>
              ) : (
                <EmptyHistoryState />
              )
            }
            className="mx-container-margin overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}
