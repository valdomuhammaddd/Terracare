import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

import {
  ConfirmBottomSheet,
  type ConfirmSheetConfig,
} from '@/components/molecules/ConfirmBottomSheet';
import { isDemoModeActive } from '@/constants/demo-config';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';
import { useEmergencyUiStore } from '@/store/emergency-ui-store';
import { hapticError } from '@/utils/haptics';

export function SosFab() {
  const [sheetConfig, setSheetConfig] = useState<ConfirmSheetConfig | null>(null);
  const user = useAuthStore((s) => s.user);
  const startFamilyAlert = useEmergencyUiStore((s) => s.startFamilyAlert);

  const openConfirm = () => {
    void hapticError();
    setSheetConfig({
      title: 'Darurat — Hubungi Keluarga',
      message:
        'Sinyal SOS akan dikirim ke kontak keluarga terdaftar dan dicatat di sistem TerraCare. Lanjutkan?',
      confirmLabel: 'Kirim SOS',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: () => {
        setSheetConfig(null);
        if (!user?.id) {
          if (!isDemoModeActive()) {
            Alert.alert('Supabase Error', JSON.stringify('Sesi tidak aktif. Silakan masuk kembali.'));
          }
          return;
        }
        void (async () => {
          try {
            await startFamilyAlert(user.id);
          } catch (error) {
            if (!isDemoModeActive()) {
              const message = error instanceof Error ? error.message : String(error);
              Alert.alert('Supabase Error', JSON.stringify(message));
            }
          }
        })();
      },
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Darurat SOS"
        accessibilityHint="Mengirim sinyal darurat ke keluarga"
        onPress={openConfirm}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        hitSlop={8}
      >
        <MaterialIcons name="emergency" size={32} color="#ffffff" />
        <Text style={styles.fabLabel}>SOS</Text>
      </Pressable>

      {sheetConfig ? (
        <ConfirmBottomSheet config={sheetConfig} onDismiss={() => setSheetConfig(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 96,
    zIndex: 40,
    elevation: 12,
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },
  fabLabel: {
    position: 'absolute',
    bottom: 2,
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
});
