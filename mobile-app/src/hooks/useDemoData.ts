import { useMemo } from 'react';

import {
  isDemoModeActive,
  shouldUseMockFallback,
  type DemoFallbackContext,
} from '@/constants/demo-config';
import { MockDataService } from '@/services/MockDataService';
import type { Device, DeviceStatus } from '@/types/supabase';

export interface DashboardSnapshot {
  bpm: number | null;
  spo2: number | null;
  batteryLevel: number;
  deviceStatus: DeviceStatus;
}

export interface ActivityEntry {
  id: string;
  message: string;
  at: string;
}

export function useDemoData() {
  return useMemo(
    () => ({
      isDemoActive: isDemoModeActive(),
      shouldUseMock: shouldUseMockFallback,
      mock: MockDataService,
    }),
    [],
  );
}

export function resolveDashboardForDemo(
  context: DemoFallbackContext & { userId?: string },
  current: {
    device: Device | null;
    dashboard: DashboardSnapshot;
    activities: ActivityEntry[];
  },
): {
  device: Device | null;
  dashboard: DashboardSnapshot;
  activities: ActivityEntry[];
  usingMock: boolean;
} {
  const usingMock = shouldUseMockFallback(context);

  if (!usingMock) {
    return { ...current, usingMock: false };
  }

  const mockDevice = MockDataService.getDevice(context.userId);
  const mockDashboard = MockDataService.getDashboardState();

  return {
    device: current.device ?? mockDevice,
    dashboard: {
      bpm: current.dashboard.bpm ?? mockDashboard.bpm,
      spo2: current.dashboard.spo2 ?? mockDashboard.spo2,
      batteryLevel: current.dashboard.batteryLevel || mockDashboard.batteryLevel,
      deviceStatus: 'online',
    },
    activities:
      current.activities.length > 0 ? current.activities : MockDataService.getActivityLogs(),
    usingMock: true,
  };
}
