import { create } from 'zustand';

import type { Device } from '@/types/supabase';

interface DeviceState {
  claimedDevice: Device | null;
  setClaimedDevice: (device: Device | null) => void;
  reset: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  claimedDevice: null,
  setClaimedDevice: (device) => set({ claimedDevice: device }),
  reset: () => set({ claimedDevice: null }),
}));
