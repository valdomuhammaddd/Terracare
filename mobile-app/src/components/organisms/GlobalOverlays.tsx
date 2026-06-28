import { EmergencyOverlay } from '@/components/organisms/EmergencyOverlay';
import { FamilyAlertOverlay } from '@/components/organisms/FamilyAlertOverlay';
import { useEmergencyUiStore } from '@/store/emergency-ui-store';

/**
 * Global overlays — only mount UI while active. No ghost Views when idle.
 */
export function GlobalOverlays() {
  const familyPhase = useEmergencyUiStore((s) => s.phase);
  const showFamily = familyPhase === 'connecting' || familyPhase === 'connected';

  return (
    <>
      <EmergencyOverlay />
      {showFamily ? <FamilyAlertOverlay /> : null}
    </>
  );
}
