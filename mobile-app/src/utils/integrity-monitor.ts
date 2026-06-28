import { MockDataService } from '@/services/MockDataService';

const TAG = '[TerraCare Integrity]';

export function logCareGridReadiness(): void {
  if (!__DEV__) return;

  const readiness = MockDataService.getCareGridReadiness();
  const labels: Record<string, string> = {
    emergency: 'Emergency → Family SOS',
    vitals: 'Vitals → Monitoring',
    reports: 'Reports → ReportsScreen',
    more: 'More → Settings',
    insights: 'Insights → InsightsScreen',
    family: 'Family → FamilyScreen (Satria Dwi Anggara)',
    medicine: 'Medicine → MedicineScreen',
    track: 'Track → TrackScreen (Sekip Jaya)',
  };

  console.log(`${TAG} ─── Care Grid Readiness ───`);
  Object.entries(readiness).forEach(([key, ok]) => {
    const icon = ok ? '✅' : '❌';
    console.log(`${TAG} ${icon} ${labels[key] ?? key}`);
  });
  console.log(`${TAG} Primary contact: ${MockDataService.getPrimaryContact().name}`);
  console.log(`${TAG} GPS: ${MockDataService.getGpsLocation().label}`);
}

export function logServiceOk(service: string, detail?: string): void {
  if (__DEV__) {
    console.log(`${TAG} ✅ ${service}${detail ? `: ${detail}` : ''}`);
  }
}

export function logServiceFail(service: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`${TAG} ❌ ${service}: ${message}`);
}
