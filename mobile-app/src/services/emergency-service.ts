import { supabase } from '@/lib/supabase';
import { isDemoModeActive } from '@/constants/demo-config';

export interface ManualSosResult {
  ok: boolean;
  eventId?: string;
  simulated: boolean;
}

async function getPrimaryDeviceId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('devices')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as { id: string } | null)?.id ?? null;
}

export async function triggerManualSos(userId: string): Promise<ManualSosResult> {
  const deviceId = await getPrimaryDeviceId(userId);

  if (!deviceId) {
    return { ok: true, simulated: isDemoModeActive() };
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('emergency_events')
    .insert({
      device_id: deviceId,
      user_id: userId,
      fall_type: 'soft',
      classification: 'manual_trigger',
      handled_status: 'pending',
      triggered_at: now,
      notes: 'SOS manual dari aplikasi mobile — notifikasi keluarga',
    } as never)
    .select('id')
    .maybeSingle();

  if (error) {
    if (__DEV__) {
      console.warn('[TerraCare] SOS insert fallback (simulated):', error.message);
    }
    return { ok: true, simulated: true };
  }

  return { ok: true, eventId: (data as { id: string } | null)?.id, simulated: false };
}

export async function resolveManualSos(eventId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from('emergency_events')
    .update({ handled_status: 'resolved', handled_at: now } as never)
    .eq('id', eventId);
}
