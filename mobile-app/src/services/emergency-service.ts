import { Alert } from 'react-native';

import { isDemoModeActive } from '@/constants/demo-config';
import { supabase } from '@/lib/supabase';

export interface ManualSosResult {
  ok: boolean;
  eventId?: string;
  simulated: boolean;
}

function alertSupabaseError(message: string): void {
  if (isDemoModeActive()) {
    if (__DEV__) {
      console.warn('[TerraCare] SOS (demo, silent):', message);
    }
    return;
  }
  Alert.alert('Supabase Error', JSON.stringify(message));
}

async function getPrimaryDeviceId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('devices')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as { id: string } | null)?.id ?? null;
}

export async function triggerManualSos(userId: string): Promise<ManualSosResult> {
  const demoFallback = isDemoModeActive();

  try {
    const deviceId = await getPrimaryDeviceId(userId);

    if (!deviceId) {
      if (demoFallback) {
        return { ok: true, simulated: true };
      }
      alertSupabaseError('Tidak ada perangkat terhubung. Hubungkan alat via Serial Number.');
      return { ok: true, simulated: true };
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
      alertSupabaseError(error.message);
      return { ok: true, simulated: true };
    }

    return {
      ok: true,
      eventId: (data as { id: string } | null)?.id,
      simulated: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    alertSupabaseError(message);
    return { ok: true, simulated: true };
  }
}

export async function resolveManualSos(eventId: string): Promise<void> {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('emergency_events')
      .update({ handled_status: 'resolved', handled_at: now } as never)
      .eq('id', eventId);

    if (error) {
      alertSupabaseError(error.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    alertSupabaseError(message);
  }
}
