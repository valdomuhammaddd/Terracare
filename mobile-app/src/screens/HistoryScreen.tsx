import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import type { EmergencyEvent, HandledStatus, VitalLog } from '@/types/supabase';

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
  if (event.fall_type === 'hard') {
    return 'Insiden Jatuh Keras';
  }
  return 'Insiden Pingsan (Soft Fall)';
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
  return {
    id: `vital-${vital.id}`,
    kind: 'vital',
    timestamp: vital.recorded_at,
    title: 'Pengecekan Rutin',
    subtitle: formatHistorySubtitle(vital.recorded_at),
    heartRateBpm: vital.heart_rate_bpm,
    spo2Percent: vital.spo2_percent,
    statusLabel: 'Aman',
    statusVariant: 'safe',
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

  const iconBg = isEmergency ? 'bg-error-container' : 'bg-primary-container';
  const iconName = isEmergency ? 'crisis-alert' : 'check-circle';
  const iconColor = isEmergency ? '#ba1a1a' : '#006948';

  const vitalsText =
    item.heartRateBpm !== null && item.spo2Percent !== null
      ? `HR: ${item.heartRateBpm} | SpO2: ${item.spo2Percent}%`
      : 'HR: -- | SpO2: --';

  return (
    <View
      className="mb-sm flex-row items-center rounded-2xl bg-surface-container-lowest p-md shadow-sm"
      style={{ elevation: 2 }}
    >
      <View className={`mr-sm h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
        <MaterialIcons name={iconName} size={24} color={iconColor} />
      </View>

      <View className="min-w-0 flex-1 pr-2">
        <Text className="text-base font-bold text-on-surface" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="mt-0.5 text-sm text-on-surface-variant">{item.subtitle}</Text>
      </View>

      <View className="items-end gap-1">
        <Text className="text-xs font-medium text-on-surface-variant">{vitalsText}</Text>
        <StatusBadge label={item.statusLabel} variant={item.statusVariant} />
      </View>
    </View>
  );
}

function EmptyHistoryState() {
  return (
    <View className="mt-xl items-center px-md py-xl">
      <View className="mb-md h-20 w-20 items-center justify-center rounded-full bg-surface-container">
        <MaterialIcons name="history" size={40} color="#586377" />
      </View>
      <Text className="text-center text-headline-md font-semibold text-on-surface">
        Belum ada riwayat aktivitas
      </Text>
      <Text className="mt-2 text-center text-body-md text-on-surface-variant">
        Riwayat pemeriksaan dan insiden darurat akan muncul di sini.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function HistoryScreen() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  const [items, setItems] = useState<HistoryItem[]>([]);
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
      setItems(history);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat riwayat';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006948" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View
          className="bg-surface-container-lowest px-container-margin pb-md pt-sm shadow-sm"
          style={{ elevation: 3 }}
        >
          <View className="flex-row items-center gap-sm">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              onPress={() => router.back()}
              className="rounded-full bg-surface-container-high p-2"
            >
              <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-headline-lg-mobile font-bold text-on-surface">
                Riwayat Kesehatan
              </Text>
              <Text className="mt-0.5 text-sm text-on-surface-variant">
                {items.length > 0 ? `${items.length} aktivitas terakhir` : 'Log pemeriksaan & insiden'}
              </Text>
            </View>
          </View>
        </View>

        {isLoading && items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#006948" />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HistoryCard item={item} />}
            contentContainerClassName="grow px-container-margin pb-xl pt-md"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void loadHistory(true)}
                tintColor="#006948"
                colors={['#006948']}
              />
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
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
