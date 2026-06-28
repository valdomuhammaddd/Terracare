import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { AppHeader } from '@/components/organisms/AppHeader';
import {
  ConfirmBottomSheet,
  type ConfirmSheetConfig,
} from '@/components/molecules/ConfirmBottomSheet';
import { EmptyState } from '@/components/molecules/EmptyState';
import { MonitoringSkeleton } from '@/components/molecules/MonitoringSkeleton';
import { NotificationSheet } from '@/components/molecules/NotificationSheet';
import { supabase } from '@/lib/supabase';
import type { Device, DeviceStatus, Profile, VitalLog } from '@/types/supabase';
import { getHealthStatus, getTimeGreeting } from '@/utils/greeting';
import { hapticLight, hapticMedium } from '@/utils/haptics';
import { isDemoModeActive } from '@/constants/demo-config';
import { resolveDashboardForDemo } from '@/hooks/useDemoData';
import { useFamilySos } from '@/hooks/useFamilySos';

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

function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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
  return [
    { id: `${Date.now()}-${Math.random()}`, message, at: new Date().toISOString() },
    ...entries,
  ].slice(0, 5);
}

function SparklineBars() {
  const heights = [0.5, 0.67, 0.75, 0.5, 0.8, 0.67, 0.5, 0.33, 1];
  return (
    <View className="h-24 w-full flex-row items-end justify-between rounded-lg bg-surface-container px-1 opacity-80">
      {heights.map((h, i) => (
        <View
          key={i}
          className="w-1.5 rounded-t bg-primary"
          style={{ height: `${h * 100}%`, opacity: 0.3 + h * 0.5 }}
        />
      ))}
    </View>
  );
}

interface RecentActivityProps {
  entries: ActivityEntry[];
  onViewAll?: () => void;
}

function RecentActivity({ entries, onViewAll }: RecentActivityProps) {
  return (
    <View className="mt-lg">
      <View className="mb-md flex-row items-center justify-between">
        <Text className="text-headline-md font-semibold text-on-surface">Aktivitas Terkini</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll}>
            <Text className="text-sm font-semibold text-primary">Lihat Riwayat</Text>
          </Pressable>
        ) : null}
      </View>
      {entries.length === 0 ? (
        <EmptyState
          title="Belum Ada Aktivitas"
          message="Sistem aktif & memantau. Data kesehatan akan segera muncul."
        />
      ) : (
        entries.map((entry) => (
          <View
            key={entry.id}
            className="mb-sm flex-row items-center rounded-xl border border-outline-variant bg-surface-container-lowest p-md"
          >
            <View className="mr-sm h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MaterialIcons name="history" size={20} color="#006948" />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-semibold text-on-surface">{entry.message}</Text>
              <Text className="text-xs text-on-surface-variant">{formatActivityTime(entry.at)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

export function DashboardScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [dashboard, setDashboard] = useState<DashboardState>(INITIAL_DASHBOARD);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sheetConfig, setSheetConfig] = useState<ConfirmSheetConfig | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { triggerFamilySos } = useFamilySos();

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

      if (isMounted && profileRow) setProfile(profileRow as Profile);

      const { data: deviceRows } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const primaryDevice = (deviceRows?.[0] ?? null) as Device | null;
      if (isMounted && primaryDevice) applyDevice(primaryDevice);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` }, handleDeviceChange)
      .subscribe();

    const vitalsChannel = supabase
      .channel(`vital_logs:user:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vital_logs', filter: `user_id=eq.${userId}` }, handleVitalInsert)
      .subscribe();

    return () => {
      void supabase.removeChannel(devicesChannel);
      void supabase.removeChannel(vitalsChannel);
    };
  }, [userId, device, applyDevice, applyVitalLog]);

  const handleManualCheck = async () => {
    if (!canManualCheck) return;
    void hapticMedium();
    setIsChecking(true);
    setActivities((prev) => prependActivity(prev, 'Pengecekan manual diminta'));
    await new Promise((resolve) => setTimeout(resolve, 800));
    setDashboard((prev) => ({
      ...prev,
      bpm: prev.bpm ?? 78,
      spo2: prev.spo2 ?? 98,
      deviceStatus: 'online',
    }));
    setIsChecking(false);
  };

  const handleEmergencyCall = () => {
    void hapticLight();
    setSheetConfig({
      title: 'Panggil Bantuan',
      message:
        'Kirim sinyal darurat ke keluarga terdaftar dan aktifkan protokol bantuan TerraCare?',
      confirmLabel: 'Kirim SOS ke Keluarga',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: () => {
        setSheetConfig(null);
        triggerFamilySos();
      },
    });
  };

  const resolved = resolveDashboardForDemo(
    {
      userId: userId ?? undefined,
      hasDevice: Boolean(device),
      hasVitals: dashboard.bpm !== null && dashboard.spo2 !== null,
      isOffline: device?.status !== 'online',
    },
    { device, dashboard, activities },
  );

  const displayDevice = resolved.device;
  const displayDashboard = resolved.dashboard;
  const displayActivities = resolved.activities;

  const isOnline = displayDashboard.deviceStatus === 'online';
  const healthStatus = getHealthStatus(displayDashboard.bpm, displayDashboard.spo2);
  const displayName = profile?.full_name ?? 'Pengguna';
  const canManualCheck = Boolean(displayDevice) || isDemoModeActive();

  if (isLoading) {
    return <MonitoringSkeleton />;
  }

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        profileName={displayName}
        onNotificationPress={() => {
          void hapticLight();
          setNotificationsOpen(true);
        }}
        onAvatarPress={() => {
          void hapticLight();
          router.push('/settings');
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-margin pb-36 pt-md"
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting card */}
        <View className="mb-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm">
          <Text className="text-sm font-medium text-[#64748b]">{getTimeGreeting()},</Text>
          <Text className="mt-1 text-2xl font-bold tracking-tight text-[#0f172a]">
            Keluarga {displayName}
          </Text>
          <View className="mt-sm flex-row items-center gap-2">
            <View className={`h-2 w-2 rounded-full ${isOnline ? 'bg-primary' : 'bg-outline'}`} />
            <Text className="text-xs font-bold uppercase tracking-wider text-primary">
              {isOnline ? 'LIVE CONNECTED' : 'OFFLINE'}
            </Text>
            {displayDevice ? (
              <Text className="text-xs text-on-surface-variant">• Baterai {displayDashboard.batteryLevel}%</Text>
            ) : null}
          </View>
        </View>

        {/* Live HR card */}
        <View className="mb-gutter overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
          <View className="mb-sm flex-row items-start justify-between">
            <View className="flex-row items-center gap-1">
              <View className="h-2 w-2 rounded-full bg-primary" />
              <Text className="text-label-md uppercase tracking-widest text-primary">Live Monitoring</Text>
            </View>
            <MaterialIcons name="more-vert" size={22} color="#545f73" />
          </View>
          <Text className="text-label-md text-on-surface-variant">Detak Jantung</Text>
          <View className="flex-row items-baseline gap-1">
            <Text
              className="text-vitals-display font-extrabold text-on-surface"
              accessibilityLabel={`Detak jantung ${displayDashboard.bpm ?? 'belum tersedia'} BPM`}
            >
              {displayDashboard.bpm ?? '--'}
            </Text>
            <Text className="text-headline-md font-bold text-secondary">BPM</Text>
          </View>
          <View className="mt-md">
            <SparklineBars />
          </View>
        </View>

        {/* Bento row: Emergency + SpO2 + Status */}
        <View className="mb-gutter flex-row gap-gutter">
          <Pressable
            onPress={handleEmergencyCall}
            hitSlop={4}
            style={({ pressed }) => [dashStyles.helpCard, pressed && { opacity: 0.92 }]}
          >
            <View className="flex-row items-start justify-between">
              <MaterialIcons name="emergency" size={36} color="#f5fff7" />
              <MaterialIcons name="north-east" size={20} color="#f5fff7" />
            </View>
            <View className="mt-md">
              <Text className="text-headline-md font-bold text-on-primary-container">
                Panggil Bantuan
              </Text>
              <Text className="text-body-md text-on-primary-container/80">
                Hubungi tim medis siaga sekarang.
              </Text>
            </View>
          </Pressable>
        </View>

        <View className="mb-gutter flex-row gap-gutter">
          <View className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <View className="mb-sm flex-row items-center gap-sm">
              <MaterialIcons name="opacity" size={20} color="#545f73" />
              <Text className="text-label-md text-on-surface-variant">SpO₂</Text>
            </View>
            <View className="flex-row items-baseline gap-1">
              <Text
                className="text-headline-lg font-extrabold text-on-surface"
                accessibilityLabel={`SpO2 ${displayDashboard.spo2 ?? 'belum tersedia'} persen`}
              >
                {displayDashboard.spo2 ?? '--'}
              </Text>
              <Text className="text-label-md font-bold text-secondary">%</Text>
            </View>
            <View className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-high">
              <View
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.min(displayDashboard.spo2 ?? 0, 100)}%` }}
              />
            </View>
          </View>
          <View className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low p-md">
            <View className="mb-sm flex-row items-center gap-sm">
              <MaterialIcons name="medical-information" size={20} color="#545f73" />
              <Text className="text-label-md text-on-surface-variant">Status Kesehatan</Text>
            </View>
            <View
              className={`self-start rounded-full px-3 py-1 ${
                healthStatus.isStable ? 'bg-primary-container' : 'bg-error-container'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  healthStatus.isStable ? 'text-on-primary-container' : 'text-on-error-container'
                }`}
              >
                {healthStatus.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Manual check */}
        <Pressable
          accessibilityRole="button"
          disabled={!canManualCheck || isChecking}
          onPress={handleManualCheck}
          className={`mb-md h-14 w-full items-center justify-center rounded-2xl bg-primary active:scale-[0.98] ${
            !canManualCheck || isChecking ? 'opacity-60' : ''
          }`}
        >
          <Text className="text-lg font-bold tracking-wider text-on-primary">
            {isChecking ? 'MEMERIKSA...' : 'Cek Kesehatan Sekarang'}
          </Text>
        </Pressable>

        {!displayDevice && !isDemoModeActive() ? (
          <Text className="mb-md text-center text-sm text-on-surface-variant">
            Belum ada perangkat terhubung. Hubungkan ESP32 untuk memulai pemantauan.
          </Text>
        ) : null}

        <RecentActivity
          entries={displayActivities}
          onViewAll={() => {
            void hapticLight();
            router.push('/(tabs)/activity');
          }}
        />
      </ScrollView>

      <ConfirmBottomSheet config={sheetConfig} onDismiss={() => setSheetConfig(null)} />
      <NotificationSheet
        visible={notificationsOpen}
        onDismiss={() => setNotificationsOpen(false)}
      />
    </View>
  );
}

const dashStyles = StyleSheet.create({
  helpCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#00855d',
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
});
