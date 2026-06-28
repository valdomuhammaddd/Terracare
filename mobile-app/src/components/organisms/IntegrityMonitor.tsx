import { useEffect } from 'react';

import { logCareGridReadiness } from '@/utils/integrity-monitor';

/** Dev-only: logs Care Grid feature readiness on mount */
export function IntegrityMonitor() {
  useEffect(() => {
    logCareGridReadiness();
  }, []);

  return null;
}
