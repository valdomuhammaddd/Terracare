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

function scheduleConnectedPhase(
  set: (partial: Partial<EmergencyUiState>) => void,
  eventId: string | null,
) {
  if (connectTimer) clearTimeout(connectTimer);

  connectTimer = setTimeout(() => {
    void hapticMedium();
    set({
      phase: 'connected',
      activeEventId: eventId,
    });
    connectTimer = null;
  }, 3000);
}

export const useEmergencyUiStore = create<EmergencyUiState>((set, get) => ({
  phase: 'idle',
  activeEventId: null,

  startFamilyAlert: async (userId: string) => {
    if (get().phase !== 'idle') return;

    void hapticError();
    set({ phase: 'connecting', activeEventId: null });

    const result = await triggerManualSos(userId);
    scheduleConnectedPhase(set, result.eventId ?? null);
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
