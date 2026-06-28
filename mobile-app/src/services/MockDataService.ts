import type { Device, DeviceStatus, VitalLog } from '@/types/supabase';

export const MOCK_BPM = 78;
export const MOCK_SPO2 = 98;
export const MOCK_BATTERY = 87;
export const MOCK_DEVICE_NAME = 'Hub-Alpha-01';
export const MOCK_DEVICE_MAC = 'TC-ALPHA-01';

/** Primary family contact for thesis demo narrative */
export const MOCK_PRIMARY_CONTACT = {
  id: 'family-1',
  name: 'Satria Dwi Anggara',
  relation: 'Anak / Caregiver Utama',
  phone: '+62 812-3456-7890',
  email: 'satria.dwi@terradigital.id',
  isPrimary: true,
  avatarInitials: 'SD',
  lastNotifiedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
};

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
  street: string;
  city: string;
  accuracyMeters: number;
}

export interface MockFamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  avatarInitials: string;
  lastNotifiedAt?: string;
}

export interface MockMedicineSchedule {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  status: 'taken' | 'pending' | 'missed';
  lastTakenAt?: string;
}

export interface MockReportEntry {
  id: string;
  title: string;
  period: string;
  summary: string;
  generatedAt: string;
  type: 'weekly' | 'monthly' | 'incident';
  status: 'ready' | 'archived';
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
      { id: 'demo-act-1', message: 'Sistem Terhubung — Hub-Alpha-01', at: minutesAgo(2) },
      { id: 'demo-act-2', message: 'Deteksi Detak Jantung Normal (78 BPM)', at: minutesAgo(8) },
      { id: 'demo-act-3', message: 'GPS Aktif — Jl. Sekip Jaya, Palembang', at: minutesAgo(15) },
      { id: 'demo-act-4', message: 'Kontak Satria Dwi Anggara tersinkron', at: minutesAgo(28) },
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
        title: 'SpO2',
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
      latitude: -2.9761,
      longitude: 104.7754,
      label: 'Jl. Sekip Jaya, Palembang',
      street: 'Jl. Sekip Jaya',
      city: 'Palembang, Sumatera Selatan',
      accuracyMeters: 8,
    };
  },

  getFamilyMembers(): MockFamilyMember[] {
    return [
      MOCK_PRIMARY_CONTACT,
      {
        id: 'family-2',
        name: 'Rina Anggara',
        relation: 'Menantu / Caregiver',
        phone: '+62 813-9876-5432',
        email: 'rina.anggara@email.com',
        isPrimary: false,
        avatarInitials: 'RA',
        lastNotifiedAt: minutesAgo(120),
      },
      {
        id: 'family-3',
        name: 'Dr. Ahmad Wijaya',
        relation: 'Dokter Keluarga',
        phone: '+62 711-555-0123',
        isPrimary: false,
        avatarInitials: 'AW',
      },
    ];
  },

  getPrimaryContact(): MockFamilyMember {
    return MOCK_PRIMARY_CONTACT;
  },

  getMedicineSchedule(): MockMedicineSchedule[] {
    return [
      {
        id: 'med-1',
        name: 'Amlodipine 5mg',
        dose: '1 tablet',
        schedule: '08:00 · Pagi',
        status: 'taken',
        lastTakenAt: minutesAgo(180),
      },
      {
        id: 'med-2',
        name: 'Metformin 500mg',
        dose: '1 tablet',
        schedule: '12:00 · Siang',
        status: 'pending',
      },
      {
        id: 'med-3',
        name: 'Vitamin D3',
        dose: '1 kapsul',
        schedule: '20:00 · Malam',
        status: 'pending',
      },
      {
        id: 'med-4',
        name: 'Aspirin 80mg',
        dose: '1 tablet',
        schedule: '20:00 · Malam',
        status: 'taken',
        lastTakenAt: minutesAgo(720),
      },
    ];
  },

  getReports(): MockReportEntry[] {
    return [
      {
        id: 'rep-1',
        title: 'Laporan Vital Sign Mingguan',
        period: '22–28 Jun 2026',
        summary: 'Rata-rata BPM 77 · SpO₂ 98% · Tidak ada insiden darurat. Satria Dwi Anggara menerima 2 notifikasi rutin.',
        generatedAt: minutesAgo(60),
        type: 'weekly',
        status: 'ready',
      },
      {
        id: 'rep-2',
        title: 'Laporan Aktivitas Bulanan',
        period: 'Mei 2026',
        summary: '142 sampel vital · 0 fall detection · Perangkat online 96% waktu.',
        generatedAt: minutesAgo(1440),
        type: 'monthly',
        status: 'ready',
      },
      {
        id: 'rep-3',
        title: 'Ringkasan Insiden SOS Manual',
        period: 'Demo Sidang',
        summary: 'SOS manual terkirim ke Satria Dwi Anggara · Respons < 3 detik · Status resolved.',
        generatedAt: minutesAgo(30),
        type: 'incident',
        status: 'archived',
      },
    ];
  },

  getInsightChartBars(): number[] {
    return [0.45, 0.62, 0.58, 0.71, 0.68, 0.75, 0.72, 0.78, 0.74, 0.8, 0.76, 0.78];
  },

  /** Care grid integrity — all 8 features demo-ready */
  getCareGridReadiness(): Record<string, boolean> {
    return {
      emergency: true,
      vitals: true,
      reports: true,
      more: true,
      insights: true,
      family: true,
      medicine: true,
      track: true,
    };
  },
};
