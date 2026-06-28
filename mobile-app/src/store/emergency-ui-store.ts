import { create } from 'zustand';

import { resolveManualSos, triggerManualSos } from '@/services/emergency-service';
import { hapticError, hapticMedium } from '@/utils/haptics';

export type FamilyAlertPhase = 'idle' | 'connecting' | 'connected';

interface EmergencyUiState {
  phase: FamilyAlertPhase;
  activeEventId: string | null;
  startFamilyAlert: (userId: string) => Promise<void>;
  cancelFamilyAlert: () => Promise<void>;
  reset: () => void;
}

let connectTimer: ReturnType<typeof setTimeout> | null = null;

export const useEmergencyUiStore = create<EmergencyUiState>((set, get) => ({
  phase: 'idle',
  activeEventId: null,

  startFamilyAlert: async (userId: string) => {
    if (get().phase !== 'idle') return;

    void hapticError();
    set({ phase: 'connecting', activeEventId: null });

    const result = await triggerManualSos(userId);

    if (connectTimer) clearTimeout(connectTimer);

    connectTimer = setTimeout(() => {
      void hapticMedium();
      set({
        phase: 'connected',
        activeEventId: result.eventId ?? null,
      });
      connectTimer = null;
    }, 3000);
  },

  cancelFamilyAlert: async () => {
    const { activeEventId, phase } = get();
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
    if (activeEventId && phase === 'connected') {
      await resolveManualSos(activeEventId);
    }
    set({ phase: 'idle', activeEventId: null });
  },

  reset: () => {
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
    set({ phase: 'idle', activeEventId: null });
  },
}));
