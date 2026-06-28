/**
 * Demo mode for thesis defense — injects realistic mock data when hardware/Supabase
 * is unavailable or returns empty results.
 *
 * Set EXPO_PUBLIC_DEMO_MODE=false to disable entirely.
 */
export function isDemoModeActive(): boolean {
  return process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';
}

export interface DemoFallbackContext {
  hasDevice?: boolean;
  hasVitals?: boolean;
  isOffline?: boolean;
  isEmpty?: boolean;
}

export function shouldUseMockFallback(context: DemoFallbackContext): boolean {
  if (!isDemoModeActive()) return false;

  return (
    context.isEmpty === true ||
    context.hasDevice === false ||
    context.hasVitals === false ||
    context.isOffline === true
  );
}
