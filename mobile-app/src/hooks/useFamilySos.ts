import { useCallback } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { useEmergencyUiStore } from '@/store/emergency-ui-store';

export function useFamilySos() {
  const user = useAuthStore((s) => s.user);
  const startFamilyAlert = useEmergencyUiStore((s) => s.startFamilyAlert);
  const phase = useEmergencyUiStore((s) => s.phase);

  const triggerFamilySos = useCallback(() => {
    if (!user?.id || phase !== 'idle') return;
    void startFamilyAlert(user.id);
  }, [user?.id, phase, startFamilyAlert]);

  return { triggerFamilySos, isBusy: phase !== 'idle' };
}
