import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { hapticError } from '@/utils/haptics';
import type {
  EmergencyEvent,
  EmergencyEventUpdate,
  EventClassification,
  FallType,
  HandledStatus,
  VitalLog,
} from '@/types/supabase';

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface FallVitals {
  bpm: number | null;
  spo2: number | null;
}

function isEmergencyEventRow(value: unknown): value is EmergencyEvent {
  if (typeof value !== 'object' || value === null) return false;
  return 'fall_type' in value && 'classification' in value && 'handled_status' in value;
}

function isVitalLogRow(value: unknown): value is VitalLog {
  if (typeof value !== 'object' || value === null) return false;
  return 'heart_rate_bpm' in value && 'spo2_percent' in value;
}

function isUnhandled(status: HandledStatus): boolean {
  return status === 'pending';
}

function isManualSosEvent(event: EmergencyEvent): boolean {
  return event.classification === 'manual_trigger';
}

function formatFallClassification(fallType: FallType, classification: EventClassification): string {
  if (fallType === 'hard') {
    return 'Jatuh Keras Terdeteksi!';
  }

  if (classification === 'confirmed_fall') {
    return 'Jatuh Terdeteksi (Soft Fall)';
  }

  if (classification === 'suspected_fall') {
    return 'Pingsan Terdeteksi (Soft Fall)';
  }

  if (classification === 'manual_trigger') {
    return 'SOS Manual Diaktifkan';
  }

  return 'Pingsan Terdeteksi (Soft Fall)';
}

async function fetchPostFallVitals(event: EmergencyEvent): Promise<FallVitals> {
  const { data: postFallVital } = await supabase
    .from('vital_logs')
    .select('*')
    .eq('device_id', event.device_id)
    .gte('recorded_at', event.triggered_at)
    .order('recorded_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (postFallVital) {
    const vital = postFallVital as VitalLog;
    return { bpm: vital.heart_rate_bpm, spo2: vital.spo2_percent };
  }

  const { data: latestVital } = await supabase
    .from('vital_logs')
    .select('*')
    .eq('device_id', event.device_id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVital) {
    const vital = latestVital as VitalLog;
    return { bpm: vital.heart_rate_bpm, spo2: vital.spo2_percent };
  }

  return { bpm: null, spo2: null };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface OverlayButtonProps {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  variant: 'critical' | 'amber' | 'outline';
  disabled?: boolean;
}

function OverlayButton({ label, icon, onPress, variant, disabled = false }: OverlayButtonProps) {
  const variantClass =
    variant === 'critical'
      ? 'bg-white'
      : variant === 'amber'
        ? 'bg-amber-500'
        : 'border-2 border-white/80 bg-transparent';

  const textClass =
    variant === 'critical' ? 'text-red-600' : variant === 'amber' ? 'text-white' : 'text-white';

  const iconColor = variant === 'critical' ? '#dc2626' : '#ffffff';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl active:scale-[0.98] ${variantClass} ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <MaterialIcons name={icon} size={22} color={iconColor} />
      <Text className={`text-base font-bold tracking-wide ${textClass}`}>{label}</Text>
    </Pressable>
  );
}

interface TriagePanelProps {
  event: EmergencyEvent;
  vitals: FallVitals;
}

function TriagePanel({ event, vitals }: TriagePanelProps) {
  const classificationLabel = formatFallClassification(event.fall_type, event.classification);

  return (
    <View
      className="w-full rounded-2xl bg-white p-md shadow-lg"
      style={{ elevation: 8 }}
    >
      <Text className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">
        Klasifikasi Kejadian
      </Text>
      <Text className="mt-2 text-center text-xl font-bold text-slate-800">{classificationLabel}</Text>

      <View className="mt-md border-t border-slate-200 pt-md">
        <Text className="mb-sm text-center text-xs font-bold uppercase tracking-widest text-slate-500">
          Vital Pasca-Kejadian
        </Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-4xl font-extrabold text-[#0b1c30]">
              {vitals.bpm !== null ? vitals.bpm : '--'}
            </Text>
            <Text className="text-sm font-semibold text-[#3d4a42]">BPM</Text>
          </View>
          <View className="h-12 w-px bg-slate-200" />
          <View className="items-center">
            <Text className="text-4xl font-extrabold text-[#0b1c30]">
              {vitals.spo2 !== null ? vitals.spo2 : '--'}
            </Text>
            <Text className="text-sm font-semibold text-[#3d4a42]">SpO₂ %</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------

export function EmergencyOverlay() {
  const [emergencyEvent, setEmergencyEvent] = useState<EmergencyEvent | null>(null);
  const [vitals, setVitals] = useState<FallVitals>({ bpm: null, spo2: null });
  const [emergencyPhone, setEmergencyPhone] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);

  const openEmergency = useCallback(async (event: EmergencyEvent) => {
    if (!isUnhandled(event.handled_status)) return;
    if (isManualSosEvent(event)) return;

    void hapticError();
    setEmergencyEvent(event);
    const nextVitals = await fetchPostFallVitals(event);
    setVitals(nextVitals);
  }, []);

  const closeEmergency = useCallback(() => {
    setEmergencyEvent(null);
    setVitals({ bpm: null, spo2: null });
  }, []);

  // Bootstrap: session, pending event, emergency contact
  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      setUserId(user.id);

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('emergency_contact_1, emergency_contact_2')
        .eq('id', user.id)
        .maybeSingle();

      if (isMounted && profileRow && typeof profileRow === 'object') {
        const row = profileRow as {
          emergency_contact_1: string | null;
          emergency_contact_2: string | null;
        };
        const phone = row.emergency_contact_1 ?? row.emergency_contact_2;
        if (phone) setEmergencyPhone(phone);
      }

      const { data: pendingEvents } = await supabase
        .from('emergency_events')
        .select('*')
        .eq('user_id', user.id)
        .eq('handled_status', 'pending')
        .order('triggered_at', { ascending: false })
        .limit(1);

      const pending = (pendingEvents?.[0] ?? null) as EmergencyEvent | null;
      if (isMounted && pending && !isManualSosEvent(pending)) {
        await openEmergency(pending);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [openEmergency]);

  // Realtime: new emergency events
  useEffect(() => {
    if (!userId) return;

    const handleEmergencyInsert = (payload: RealtimePostgresChangesPayload<EmergencyEvent>) => {
      if (payload.eventType !== 'INSERT') return;

      const row = payload.new;
      if (!isEmergencyEventRow(row)) return;
      if (row.user_id !== userId) return;
      if (!isUnhandled(row.handled_status)) return;
      if (isManualSosEvent(row)) return;

      void openEmergency(row);
    };

    const channel = supabase
      .channel(`emergency_events:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_events',
          filter: `user_id=eq.${userId}`,
        },
        handleEmergencyInsert,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, openEmergency]);

  // Realtime: post-fall vitals while overlay is open
  useEffect(() => {
    if (!emergencyEvent) return;

    const handleVitalInsert = (payload: RealtimePostgresChangesPayload<VitalLog>) => {
      if (payload.eventType !== 'INSERT') return;

      const row = payload.new;
      if (!isVitalLogRow(row)) return;
      if (row.device_id !== emergencyEvent.device_id) return;

      setVitals({ bpm: row.heart_rate_bpm, spo2: row.spo2_percent });
    };

    const channel = supabase
      .channel(`emergency_vitals:${emergencyEvent.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vital_logs',
          filter: `device_id=eq.${emergencyEvent.device_id}`,
        },
        handleVitalInsert,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [emergencyEvent]);

  const handleCallAmbulance = () => {
    void Linking.openURL('tel:119');
  };

  const handleCallEmergencyContact = () => {
    if (emergencyPhone) {
      void Linking.openURL(`tel:${emergencyPhone}`);
      return;
    }
    void Linking.openURL('tel:112');
  };

  const handleDismiss = async () => {
    if (!emergencyEvent || isDismissing) return;

    setIsDismissing(true);

    const handledAt = new Date().toISOString();

    const updatePayload: EmergencyEventUpdate = {
      handled_status: 'resolved',
      handled_at: handledAt,
      notes: 'Ditandai aman oleh keluarga via aplikasi',
    };

    const { error } = await supabase
      .from('emergency_events')
      .update(updatePayload as never)
      .eq('id', emergencyEvent.id);

    setIsDismissing(false);

    if (!error) {
      closeEmergency();
    }
  };

  if (!emergencyEvent || !isUnhandled(emergencyEvent.handled_status)) {
    return null;
  }

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View className="absolute inset-0 z-50 flex-1 bg-[#ba1a1a]">
        <SafeAreaView className="flex-1 bg-[#ba1a1a]" edges={['top', 'bottom']}>
          <View className="flex-1 px-container-margin py-md">
            {/* Warning title */}
            <View className="mt-md items-center">
              <MaterialIcons name="crisis-alert" size={48} color="#ffffff" />
              <Text className="mt-sm text-center text-3xl font-black tracking-tight text-white">
                PERINGATAN BAHAYA!
              </Text>
              <Text className="mt-2 text-center text-lg font-semibold text-white">
                Sistem mendeteksi kejadian darurat. Segera lakukan triase.
              </Text>
            </View>

            {/* Triage panel */}
            <View className="my-md flex-1 justify-center">
              <TriagePanel event={emergencyEvent} vitals={vitals} />
            </View>

            {/* Actions */}
            <View className="gap-sm pb-md">
              <OverlayButton
                label="Hubungi Ambulans (119)"
                icon="local-hospital"
                variant="critical"
                onPress={handleCallAmbulance}
              />
              <OverlayButton
                label="Panggil Kontak Darurat"
                icon="phone-in-talk"
                variant="amber"
                onPress={handleCallEmergencyContact}
              />
              <OverlayButton
                label="Abaikan / Kondisi Aman"
                icon="check-circle"
                variant="outline"
                disabled={isDismissing}
                onPress={handleDismiss}
              />
              {isDismissing ? (
                <Text className="mt-2 text-center text-sm font-semibold text-white">
                  Menyimpan...
                </Text>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
