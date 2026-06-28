import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { claimDeviceBySerial } from '@/services/device-claim-service';
import { useAuthStore } from '@/store/auth-store';
import { hapticLight, hapticSuccess } from '@/utils/haptics';

interface DeviceClaimModalProps {
  visible: boolean;
  onDismiss: () => void;
  onClaimed?: (deviceName: string) => void;
}

export function DeviceClaimModal({ visible, onDismiss, onClaimed }: DeviceClaimModalProps) {
  const user = useAuthStore((s) => s.user);
  const [serial, setSerial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible) {
    return null;
  }

  const handleConnect = async () => {
    if (!user?.id) {
      Alert.alert('Gagal', 'Sesi tidak aktif. Silakan masuk kembali.');
      return;
    }

    void hapticLight();
    setIsSubmitting(true);

    const result = await claimDeviceBySerial(serial, user.id);
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.reason === 'NOT_FOUND') {
        Alert.alert('Alat Tidak Ditemukan', result.message);
      } else {
        Alert.alert('Gagal Menghubungkan', result.message);
      }
      return;
    }

    void hapticSuccess();
    setSerial('');
    onClaimed?.(result.device.name);
    onDismiss();
    Alert.alert(
      'Berhasil Terhubung',
      `Perangkat ${result.device.name} (${result.device.mac_address}) siap dipantau.`,
    );
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSerial('');
    onDismiss();
  };

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropTap} onPress={handleClose} accessibilityLabel="Tutup" />
          <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <View style={styles.iconCircle}>
                <MaterialIcons name="sensors" size={32} color="#006948" />
              </View>
              <Text style={styles.title}>Hubungkan Perangkat</Text>
              <Text style={styles.subtitle}>
                Masukkan Serial Number yang tertera pada TerraCare Hub. Tidak perlu Bluetooth — alat
                sudah ter-provision di cloud.
              </Text>

              <Text style={styles.label}>Serial Number Alat</Text>
              <TextInput
                value={serial}
                onChangeText={setSerial}
                placeholder="TC-ALPHA-01"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isSubmitting}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void handleConnect()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (pressed || isSubmitting) && { opacity: 0.9 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Hubungkan</Text>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleClose}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.secondaryBtnText}>Batal</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(11, 28, 48, 0.45)',
  },
  backdropTap: {
    flex: 1,
  },
  sheetWrap: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#bccac0',
    marginBottom: 16,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b1c30',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#586377',
    textAlign: 'center',
  },
  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0b1c30',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#bccac0',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#0b1c30',
    backgroundColor: '#f8f9ff',
  },
  primaryBtn: {
    marginTop: 20,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#006948',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#586377',
  },
});
