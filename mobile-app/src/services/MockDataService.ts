import type { Device, DeviceStatus, VitalLog } from '@/types/supabase';

export const MOCK_BPM = 78;
export const MOCK_SPO2 = 98;
export const MOCK_BATTERY = 87;
export const MOCK_DEVICE_NAME = 'Hub-Alpha-01';
export const MOCK_DEVICE_MAC = 'AA:BB:CC:DD:EE:01';

export interface MockActivityEntry {
  id: string;
  message: string;
  at: string;
}

export interface MockHistoryEntry {
  id: string;
  kind: 'emergency' | 'vital';
  timestamp: string;
  title: string;
  subtitle: string;
  heartRateBpm: number | null;
  spo2Percent: number | null;
  statusLabel: string;
  statusVariant: 'safe' | 'handled' | 'pending';
}

export interface MockGpsLocation {
  latitude: number;
  longitude: number;
  label: string;
  accuracyMeters: number;
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function formatSubtitle(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `Hari ini, ${time} WIB`;
}

export const MockDataService = {
  getDashboardState() {
    return {
      bpm: MOCK_BPM,
      spo2: MOCK_SPO2,
      batteryLevel: MOCK_BATTERY,
      deviceStatus: 'online' as DeviceStatus,
    };
  },

  getDevice(userId = 'demo-user'): Device {
    const now = new Date().toISOString();
    return {
      id: '00000000-0000-4000-8000-000000000001',
      user_id: userId,
      mac_address: MOCK_DEVICE_MAC,
      name: MOCK_DEVICE_NAME,
      battery_level: MOCK_BATTERY,
      status: 'online',
      firmware_version: '1.0.0-demo',
      last_seen_at: now,
      fall_threshold_g: 2.5,
      angle_threshold_deg: 60,
      created_at: now,
      updated_at: now,
    };
  },

  getActivityLogs(): MockActivityEntry[] {
    return [
      { id: 'demo-act-1', message: 'Sistem Terhubung', at: minutesAgo(2) },
      { id: 'demo-act-2', message: 'Deteksi Detak Jantung Normal', at: minutesAgo(8) },
      { id: 'demo-act-3', message: 'Mode Pantauan Aktif', at: minutesAgo(15) },
    ];
  },

  getHistoryEntries(): MockHistoryEntry[] {
    const t1 = minutesAgo(5);
    const t2 = minutesAgo(22);
    const t3 = minutesAgo(45);

    return [
      {
        id: 'demo-hist-1',
        kind: 'vital',
        timestamp: t1,
        title: 'Heart Rate',
        subtitle: formatSubtitle(t1),
        heartRateBpm: MOCK_BPM,
        spo2Percent: MOCK_SPO2,
        statusLabel: 'Aman',
        statusVariant: 'safe',
      },
      {
        id: 'demo-hist-2',
        kind: 'vital',
        timestamp: t2,
        title: 'Heart Rate',
        subtitle: formatSubtitle(t2),
        heartRateBpm: 76,
        spo2Percent: 97,
        statusLabel: 'Aman',
        statusVariant: 'safe',
      },
      {
        id: 'demo-hist-3',
        kind: 'vital',
        timestamp: t3,
        title: 'Heart Rate',
        subtitle: formatSubtitle(t3),
        heartRateBpm: 74,
        spo2Percent: 96,
        statusLabel: 'Aman',
        statusVariant: 'safe',
      },
    ];
  },

  getInsightVitals(userId = 'demo-user'): VitalLog[] {
    const deviceId = '00000000-0000-4000-8000-000000000001';
    const samples: VitalLog[] = [];

    for (let i = 0; i < 12; i += 1) {
      const recordedAt = minutesAgo(i * 18 + 3);
      samples.push({
        id: `demo-vital-${i}`,
        device_id: deviceId,
        user_id: userId,
        heart_rate_bpm: MOCK_BPM + (i % 3) - 1,
        spo2_percent: MOCK_SPO2 - (i % 2),
        recorded_at: recordedAt,
        created_at: recordedAt,
      });
    }

    return samples;
  },

  getGpsLocation(): MockGpsLocation {
    return {
      latitude: -6.2088,
      longitude: 106.8456,
      label: 'Rumah — Jakarta Selatan (Simulasi Demo)',
      accuracyMeters: 12,
    };
  },

  getInsightChartBars(): number[] {
    return [0.45, 0.62, 0.58, 0.71, 0.68, 0.75, 0.72, 0.78, 0.74, 0.8, 0.76, 0.78];
  },
};
