import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { Device } from '@/types/supabase';

export type ClaimDeviceResult =
  | { ok: true; device: Device }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_CLAIMED' | 'ERROR'; message: string };

function parseRpcDevice(data: unknown): Device | null {
  if (!data || typeof data !== 'object') return null;
  return data as Device;
}

export async function claimDeviceBySerial(
  serial: string,
  userId: string,
): Promise<ClaimDeviceResult> {
  const normalized = serial.trim().toUpperCase();

  if (!normalized) {
    return { ok: false, reason: 'ERROR', message: 'Masukkan Serial Number alat.' };
  }

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'claim_device_by_serial' as never,
      { p_mac_address: normalized } as never,
    );

    if (!rpcError && rpcData) {
      const device = parseRpcDevice(rpcData);
      if (device) {
        return { ok: true, device };
      }
    }

    if (rpcError) {
      const msg = rpcError.message ?? '';
      if (msg.includes('DEVICE_NOT_FOUND')) {
        return {
          ok: false,
          reason: 'NOT_FOUND',
          message: 'Alat tidak ditemukan. Periksa kembali Serial Number.',
        };
      }
      if (msg.includes('DEVICE_ALREADY_CLAIMED')) {
        return {
          ok: false,
          reason: 'ALREADY_CLAIMED',
          message: 'Alat sudah terhubung ke akun lain.',
        };
      }
    }

    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('mac_address', normalized)
      .maybeSingle();

    if (fetchError) {
      Alert.alert('Supabase Error', JSON.stringify(fetchError.message));
      return { ok: false, reason: 'ERROR', message: fetchError.message };
    }

    if (!device) {
      return {
        ok: false,
        reason: 'NOT_FOUND',
        message: 'Alat tidak ditemukan. Periksa kembali Serial Number.',
      };
    }

    const row = device as Device;

    if (row.user_id === userId) {
      return { ok: true, device: row };
    }

    const { data: updated, error: updateError } = await supabase
      .from('devices')
      .update({ user_id: userId, status: 'online' } as never)
      .eq('id', row.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      Alert.alert('Supabase Error', JSON.stringify(updateError.message));
      return { ok: false, reason: 'ERROR', message: updateError.message };
    }

    return { ok: true, device: (updated ?? row) as Device };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Alert.alert('Supabase Error', JSON.stringify(message));
    return { ok: false, reason: 'ERROR', message };
  }
}
