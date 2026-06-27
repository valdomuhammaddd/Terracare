import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import type { Device, EmergencyEvent, HandledStatus, Profile, VitalLog } from '@/types/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminDeviceRow {
  device: Device;
  patientName: string;
  latestBpm: number | null;
  latestSpo2: number | null;
  hasActiveEmergency: boolean;
}

interface GlobalStats {
  activeDevices: number;
  offlineDevices: number;
  unresolvedEmergencies: number;
}

const UNRESOLVED_STATUSES: HandledStatus[] = ['pending', 'acknowledged'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDeviceRow(value: unknown): value is Device {
  if (typeof value !== 'object' || value === null) return false;
  return 'mac_address' in value && 'user_id' in value;
}

function isVitalLogRow(value: unknown): value is VitalLog {
  if (typeof value !== 'object' || value === null) return false;
  return 'heart_rate_bpm' in value && 'device_id' in value;
}

function isEmergencyRow(value: unknown): value is EmergencyEvent {
  if (typeof value !== 'object' || value === null) return false;
  return 'fall_type' in value && 'handled_status' in value;
}

function isOnlineDevice(status: Device['status']): boolean {
  return status === 'online';
}

function buildLatestVitalsMap(logs: VitalLog[]): Map<string, VitalLog> {
  const map = new Map<string, VitalLog>();
  for (const log of logs) {
    const existing = map.get(log.device_id);
    if (!existing || new Date(log.recorded_at) > new Date(existing.recorded_at)) {
      map.set(log.device_id, log);
    }
  }
  return map;
}

function buildActiveEmergencySet(events: EmergencyEvent[]): Set<string> {
  const set = new Set<string>();
  for (const event of events) {
    if (UNRESOLVED_STATUSES.includes(event.handled_status)) {
      set.add(event.device_id);
    }
  }
  return set;
}

function computeStats(
  devices: Device[],
  emergencies: EmergencyEvent[],
): GlobalStats {
  const activeDevices = devices.filter((d) => isOnlineDevice(d.status)).length;
  const offlineDevices = devices.length - activeDevices;
  const unresolvedEmergencies = emergencies.filter((e) =>
    UNRESOLVED_STATUSES.includes(e.handled_status),
  ).length;

  return { activeDevices, offlineDevices, unresolvedEmergencies };
}

function buildDeviceRows(
  devices: Device[],
  profilesById: Map<string, Profile>,
  vitalsByDevice: Map<string, VitalLog>,
  emergencyDeviceIds: Set<string>,
): AdminDeviceRow[] {
  return devices.map((device) => {
    const profile = profilesById.get(device.user_id);
    const vital = vitalsByDevice.get(device.id);

    return {
      device,
      patientName: profile?.full_name ?? 'Pasien Tidak Diketahui',
      latestBpm: vital?.heart_rate_bpm ?? null,
      latestSpo2: vital?.spo2_percent ?? null,
      hasActiveEmergency: emergencyDeviceIds.has(device.id),
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: number;
  accentClass: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

function StatCard({ label, value, accentClass, icon }: StatCardProps) {
  return (
    <View
      className="flex-1 rounded-2xl bg-surface-container-lowest p-sm shadow-md"
      style={{ elevation: 3 }}
    >
      <View className={`mb-1 self-start rounded-full p-1.5 ${accentClass}`}>
        <MaterialIcons name={icon} size={16} color="#ffffff" />
      </View>
      <Text className="text-2xl font-bold text-on-surface">{value}</Text>
      <Text className="text-xs font-medium text-on-surface-variant">{label}</Text>
    </View>
  );
}

interface DeviceCardProps {
  row: AdminDeviceRow;
}

function DeviceCard({ row }: DeviceCardProps) {
  const isOnline = isOnlineDevice(row.device.status);

  return (
    <View
      className={`mb-sm rounded-2xl bg-surface-container-lowest p-md shadow-md ${
        row.hasActiveEmergency ? 'border-2 border-error' : 'border border-outline-variant/40'
      }`}
      style={{ elevation: row.hasActiveEmergency ? 6 : 3 }}
    >
      {row.hasActiveEmergency ? (
        <View className="mb-sm flex-row items-center gap-1 rounded-full bg-error px-3 py-1 self-start">
          <MaterialIcons name="crisis-alert" size={14} color="#ffffff" />
          <Text className="text-xs font-bold uppercase tracking-wider text-on-error">
            Darurat Aktif
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-bold text-on-surface">{row.patientName}</Text>
          <Text className="mt-0.5 text-sm text-on-surface-variant">{row.device.name}</Text>
          <Text className="text-xs text-on-surface-variant/70">{row.device.mac_address}</Text>
        </View>
        <View
          className={`rounded-full px-3 py-1 ${isOnline ? 'bg-primary-container' : 'bg-surface-container-high'}`}
        >
          <Text
            className={`text-xs font-bold ${isOnline ? 'text-on-primary-container' : 'text-on-surface-variant'}`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <View className="mt-sm flex-row gap-gutter border-t border-outline-variant/30 pt-sm">
        <View className="flex-1 flex-row items-center gap-2">
          <MaterialIcons name="favorite" size={18} color="#ba1a1a" />
          <Text className="text-lg font-bold text-on-surface">
            {row.latestBpm !== null ? row.latestBpm : '--'}
          </Text>
          <Text className="text-xs text-on-surface-variant">BPM</Text>
        </View>
        <View className="flex-1 flex-row items-center gap-2">
          <MaterialIcons name="water-drop" size={18} color="#2563eb" />
          <Text className="text-lg font-bold text-on-surface">
            {row.latestSpo2 !== null ? row.latestSpo2 : '--'}
          </Text>
          <Text className="text-xs text-on-surface-variant">SpO₂</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function AdminDashboardScreen() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  const signOut = useAuthStore((state) => state.signOut);

  const [devices, setDevices] = useState<Device[]>([]);
  const [profilesById, setProfilesById] = useState<Map<string, Profile>>(new Map());
  const [vitalsByDevice, setVitalsByDevice] = useState<Map<string, VitalLog>>(new Map());
  const [emergencies, setEmergencies] = useState<EmergencyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const emergencyDeviceIds = useMemo(
    () => buildActiveEmergencySet(emergencies),
    [emergencies],
  );

  const stats = useMemo(() => computeStats(devices, emergencies), [devices, emergencies]);

  const deviceRows = useMemo(
    () => buildDeviceRows(devices, profilesById, vitalsByDevice, emergencyDeviceIds),
    [devices, profilesById, vitalsByDevice, emergencyDeviceIds],
  );

  const bootstrap = useCallback(async () => {
    setIsLoading(true);

    const [profilesRes, devicesRes, vitalsRes, emergenciesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('devices').select('*').order('created_at', { ascending: false }),
      supabase.from('vital_logs').select('*').order('recorded_at', { ascending: false }).limit(500),
      supabase.from('emergency_events').select('*').order('triggered_at', { ascending: false }),
    ]);

    if (profilesRes.data) {
      const map = new Map<string, Profile>();
      for (const profile of profilesRes.data as Profile[]) {
        map.set(profile.id, profile);
      }
      setProfilesById(map);
    }

    if (devicesRes.data) {
      setDevices(devicesRes.data as Device[]);
    }

    if (vitalsRes.data) {
      setVitalsByDevice(buildLatestVitalsMap(vitalsRes.data as VitalLog[]));
    }

    if (emergenciesRes.data) {
      setEmergencies(emergenciesRes.data as EmergencyEvent[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Global realtime — no user_id filter (admin RLS grants full access)
  useEffect(() => {
    const devicesChannel = supabase
      .channel('admin:devices:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload: RealtimePostgresChangesPayload<Device>) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old;
            if (isDeviceRow(oldRow)) {
              setDevices((prev) => prev.filter((d) => d.id !== oldRow.id));
            }
            return;
          }

          const row = payload.new;
          if (!isDeviceRow(row)) return;

          setDevices((prev) => {
            const index = prev.findIndex((d) => d.id === row.id);
            if (index === -1) return [row, ...prev];
            const next = [...prev];
            next[index] = row;
            return next;
          });
        },
      )
      .subscribe();

    const vitalsChannel = supabase
      .channel('admin:vital_logs:global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vital_logs' },
        (payload: RealtimePostgresChangesPayload<VitalLog>) => {
          const row = payload.new;
          if (!isVitalLogRow(row)) return;

          setVitalsByDevice((prev) => {
            const next = new Map(prev);
            const existing = next.get(row.device_id);
            if (!existing || new Date(row.recorded_at) > new Date(existing.recorded_at)) {
              next.set(row.device_id, row);
            }
            return next;
          });
        },
      )
      .subscribe();

    const emergenciesChannel = supabase
      .channel('admin:emergency_events:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_events' },
        (payload: RealtimePostgresChangesPayload<EmergencyEvent>) => {
          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old;
            if (isEmergencyRow(oldRow)) {
              setEmergencies((prev) => prev.filter((e) => e.id !== oldRow.id));
            }
            return;
          }

          const row = payload.new;
          if (!isEmergencyRow(row)) return;

          setEmergencies((prev) => {
            const index = prev.findIndex((e) => e.id === row.id);
            if (index === -1) return [row, ...prev];
            const next = [...prev];
            next[index] = row;
            return next;
          });
        },
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('admin:profiles:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          if (payload.eventType === 'DELETE') return;
          const row = payload.new as Profile | undefined;
          if (!row?.id) return;
          setProfilesById((prev) => {
            const next = new Map(prev);
            next.set(row.id, row);
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(devicesChannel);
      void supabase.removeChannel(vitalsChannel);
      void supabase.removeChannel(emergenciesChannel);
      void supabase.removeChannel(profilesChannel);
    };
  }, []);

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
        {/* Header */}
        <View className="flex-row items-center justify-between px-container-margin pb-sm pt-md">
          <View className="flex-1">
            <Text className="text-headline-lg-mobile font-bold text-on-surface">
              Admin Panel
            </Text>
            <Text className="text-body-md text-primary">Monitor Lansia</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void signOut()}
            className="rounded-full bg-surface-container-high px-4 py-2"
          >
            <Text className="text-sm font-bold text-on-surface">Keluar</Text>
          </Pressable>
        </View>

        {/* Global stats */}
        <View className="flex-row gap-sm px-container-margin pb-md">
          <StatCard
            label="Perangkat Aktif"
            value={stats.activeDevices}
            accentClass="bg-primary-container"
            icon="monitor-heart"
          />
          <StatCard
            label="Offline"
            value={stats.offlineDevices}
            accentClass="bg-secondary"
            icon="cloud-off"
          />
          <StatCard
            label="Darurat Belum Selesai"
            value={stats.unresolvedEmergencies}
            accentClass="bg-error"
            icon="emergency"
          />
        </View>

        {/* Device list */}
        <FlatList
          data={deviceRows}
          keyExtractor={(item) => item.device.id}
          renderItem={({ item }) => <DeviceCard row={item} />}
          contentContainerClassName="px-container-margin pb-xl"
          ListHeaderComponent={
            <Text className="mb-sm text-headline-md font-semibold text-on-surface">
              Semua Perangkat Terdaftar
            </Text>
          }
          ListEmptyComponent={
            <View className="rounded-2xl bg-surface-container-lowest p-md">
              <Text className="text-center text-body-md text-on-surface-variant">
                Belum ada perangkat terdaftar.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}
