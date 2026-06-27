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
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Device, DeviceStatus, Profile, VitalLog } from '@/types/supabase';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface ActivityEntry {
  id: string;
  message: string;
  at: string;
}

interface DashboardState {
  bpm: number | null;
  spo2: number | null;
  batteryLevel: number;
  deviceStatus: DeviceStatus;
}

const INITIAL_DASHBOARD: DashboardState = {
  bpm: null,
  spo2: null,
  batteryLevel: 0,
  deviceStatus: 'offline',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isDeviceRow(value: unknown): value is Device {
  if (typeof value !== 'object' || value === null) return false;
  return 'mac_address' in value && 'battery_level' in value && 'status' in value;
}

function isVitalLogRow(value: unknown): value is VitalLog {
  if (typeof value !== 'object' || value === null) return false;
  return 'heart_rate_bpm' in value && 'spo2_percent' in value;
}

function prependActivity(entries: ActivityEntry[], message: string): ActivityEntry[] {
  return [{ id: `${Date.now()}-${Math.random()}`, message, at: new Date().toISOString() }, ...entries].slice(
    0,
    3,
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ConnectionStatusBadgeProps {
  isOnline: boolean;
}

function ConnectionStatusBadge({ isOnline }: ConnectionStatusBadgeProps) {
  return (
    <View
      className={`rounded-full px-3 py-1 ${isOnline ? 'bg-primary-container' : 'bg-surface-container-high'}`}
    >
      <Text
        className={`text-xs font-bold tracking-wider ${isOnline ? 'text-on-primary-container' : 'text-on-surface-variant'}`}
      >
        {isOnline ? 'AKTIF' : 'OFFLINE'}
      </Text>
    </View>
  );
}

interface BatteryIndicatorProps {
  level: number;
}

function BatteryIndicator({ level }: BatteryIndicatorProps) {
  const clamped = Math.max(0, Math.min(100, level));
  const iconName =
    clamped >= 80 ? 'battery-full' : clamped >= 40 ? 'battery-5-bar' : clamped >= 15 ? 'battery-3-bar' : 'battery-alert';

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surface-container-low px-2 py-1">
      <MaterialIcons name={iconName} size={18} color="#3d4a42" />
      <Text className="text-xs font-semibold text-on-surface-variant">{clamped}%</Text>
    </View>
  );
}

interface VitalCardProps {
  label: string;
  value: number | null;
  unit: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBackground: string;
}

function VitalCard({ label, value, unit, iconName, iconColor, iconBackground }: VitalCardProps) {
  return (
    <View
      className="flex-1 rounded-2xl bg-surface-container-lowest p-md shadow-md"
      style={{ elevation: 4 }}
    >
      <View className="mb-sm flex-row items-center justify-between">
        <Text className="text-label-md uppercase tracking-wider text-secondary">{label}</Text>
        <View className={`rounded-full p-1.5 ${iconBackground}`}>
          <MaterialIcons name={iconName} size={18} color={iconColor} />
        </View>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-4xl font-bold tracking-tight text-on-surface">
          {value !== null ? value : '--'}
        </Text>
        <Text className="text-sm font-medium text-on-surface-variant">{unit}</Text>
      </View>
    </View>
  );
}

interface RecentActivityProps {
  entries: ActivityEntry[];
}

function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <View className="mt-md">
      <Text className="mb-sm text-headline-md font-semibold text-on-surface">Aktivitas Terkini</Text>
      {entries.length === 0 ? (
        <View className="rounded-2xl bg-surface-container-lowest p-md shadow-sm">
          <Text className="text-body-md text-on-surface-variant">Belum ada aktivitas tercatat.</Text>
        </View>
      ) : (
        entries.map((entry) => (
          <View
            key={entry.id}
            className="mb-sm flex-row items-center justify-between rounded-2xl bg-surface-container-lowest px-md py-sm shadow-sm"
          >
            <Text className="flex-1 text-body-md text-on-surface">{entry.message}</Text>
            <Text className="ml-2 text-xs text-on-surface-variant">{formatActivityTime(entry.at)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function DashboardScreen() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  const [profile, setProfile] = useState<Profile | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_DASHBOARD);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const applyDevice = useCallback((nextDevice: Device) => {
    setDevice(nextDevice);
    setDashboard((prev) => ({
      ...prev,
      batteryLevel: nextDevice.battery_level,
      deviceStatus: nextDevice.status,
    }));
  }, []);

  const applyVitalLog = useCallback((log: VitalLog) => {
    setDashboard((prev) => ({
      ...prev,
      bpm: log.heart_rate_bpm,
      spo2: log.spo2_percent,
    }));
    setActivities((prev) =>
      prependActivity(
        prev,
        `Vital diperbarui: ${log.heart_rate_bpm} BPM, ${log.spo2_percent}% SpO₂`,
      ),
    );
  }, []);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setIsLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        if (isMounted) setIsLoading(false);
        return;
      }

      if (isMounted) setUserId(user.id);

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (isMounted && profileRow) {
        setProfile(profileRow as Profile);
      }

      const { data: deviceRows } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const primaryDevice = (deviceRows?.[0] ?? null) as Device | null;

      if (isMounted && primaryDevice) {
        applyDevice(primaryDevice);
      }

      if (primaryDevice) {
        const { data: latestVital } = await supabase
          .from('vital_logs')
          .select('*')
          .eq('device_id', primaryDevice.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (isMounted && latestVital) {
          const vital = latestVital as VitalLog;
          setDashboard((prev) => ({
            ...prev,
            bpm: vital.heart_rate_bpm,
            spo2: vital.spo2_percent,
          }));
        }
      }

      if (isMounted) setIsLoading(false);
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [applyDevice]);

  // Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const handleDeviceChange = (payload: RealtimePostgresChangesPayload<Device>) => {
      if (payload.eventType === 'DELETE') return;

      const row = payload.new;
      if (!isDeviceRow(row)) return;

      if (device && row.id !== device.id) return;

      const previousStatus = isDeviceRow(payload.old) ? payload.old.status : null;
      applyDevice(row);

      if (previousStatus !== 'online' && row.status === 'online') {
        setActivities((prev) => prependActivity(prev, 'Alat diaktifkan'));
      }
    };

    const handleVitalInsert = (payload: RealtimePostgresChangesPayload<VitalLog>) => {
      if (payload.eventType !== 'INSERT') return;

      const row = payload.new;
      if (!isVitalLogRow(row)) return;
      if (device && row.device_id !== device.id) return;

      applyVitalLog(row);
    };

    const devicesChannel = supabase
      .channel(`devices:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${userId}`,
        },
        handleDeviceChange,
      )
      .subscribe();

    const vitalsChannel = supabase
      .channel(`vital_logs:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_logs',
          filter: `user_id=eq.${userId}`,
        },
        handleVitalInsert,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(devicesChannel);
      void supabase.removeChannel(vitalsChannel);
    };
  }, [userId, device, applyDevice, applyVitalLog]);

  const handleManualCheck = async () => {
    if (!device || !userId) return;

    setIsChecking(true);
    setActivities((prev) => prependActivity(prev, 'Pengecekan manual'));

    // Placeholder for Edge Function / device command — records intent locally for now.
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsChecking(false);
  };

  const isOnline = dashboard.deviceStatus === 'online';
  const displayName = profile ? getFirstName(profile.full_name) : 'Keluarga';

  if (!fontsLoaded || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006948" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-container-margin pb-xl pt-md"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-md flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-headline-lg-mobile font-bold text-on-surface">
                Halo, Keluarga {displayName}
              </Text>
              <Text className="mt-1 text-body-md text-on-surface-variant">
                Pemantauan kesehatan real-time
              </Text>
            </View>
            <View className="items-end gap-2">
              <View className="flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Riwayat Kesehatan"
                  onPress={() => router.push('/history')}
                  className="rounded-full bg-surface-container-high p-2"
                >
                  <MaterialIcons name="history" size={22} color="#0b1c30" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Pengaturan"
                  onPress={() => router.push('/settings')}
                  className="rounded-full bg-surface-container-high p-2"
                >
                  <MaterialIcons name="settings" size={22} color="#0b1c30" />
                </Pressable>
              </View>
              <ConnectionStatusBadge isOnline={isOnline} />
              <BatteryIndicator level={dashboard.batteryLevel} />
            </View>
          </View>

          {/* Vitals grid */}
          <View className="flex-row gap-gutter">
            <VitalCard
              label="Heart Rate"
              value={dashboard.bpm}
              unit="BPM"
              iconName="favorite"
              iconColor="#ba1a1a"
              iconBackground="bg-error-container"
            />
            <VitalCard
              label="SpO₂"
              value={dashboard.spo2}
              unit="%"
              iconName="water-drop"
              iconColor="#2563eb"
              iconBackground="bg-secondary-container"
            />
          </View>

          {/* Manual check CTA */}
          <Pressable
            accessibilityRole="button"
            disabled={!device || isChecking}
            onPress={handleManualCheck}
            className={`mt-md h-14 w-full items-center justify-center rounded-2xl bg-emerald-500 active:scale-[0.98] ${
              !device || isChecking ? 'opacity-60' : ''
            }`}
          >
            <Text className="text-lg font-bold tracking-wide text-white">
              {isChecking ? 'MEMERIKSA...' : 'Cek Kesehatan Sekarang'}
            </Text>
          </Pressable>

          {!device ? (
            <Text className="mt-2 text-center text-sm text-on-surface-variant">
              Belum ada perangkat terhubung. Hubungkan ESP32 untuk memulai pemantauan.
            </Text>
          ) : null}

          {/* Recent activity */}
          <RecentActivity entries={activities} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
