import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useEmergencyUiStore } from '@/store/emergency-ui-store';

export function FamilyAlertOverlay() {
  const phase = useEmergencyUiStore((s) => s.phase);
  const cancelFamilyAlert = useEmergencyUiStore((s) => s.cancelFamilyAlert);

  const visible = phase === 'connecting' || phase === 'connected';

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.card}>
            <MaterialIcons
              name={phase === 'connecting' ? 'contact-phone' : 'check-circle'}
              size={56}
              color="#ffffff"
            />
            <Text style={styles.title}>
              {phase === 'connecting'
                ? 'MENGHUBUNGI KELUARGA...'
                : 'KELUARGA TELAH MENERIMA NOTIFIKASI'}
            </Text>
            <Text style={styles.subtitle}>
              {phase === 'connecting'
                ? 'Sinyal darurat dikirim ke kontak keluarga terdaftar melalui TerraCare Cloud.'
                : 'Kontak darurat Anda telah diberitahu. Tim siap membantu.'}
            </Text>
            {phase === 'connecting' ? (
              <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 24 }} />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void cancelFamilyAlert()}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.cancelText}>Batalkan Darurat</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(186, 26, 26, 0.95)',
  },
  safe: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    alignItems: 'center',
    padding: 32,
  },
  title: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 28,
    height: 56,
    minWidth: 240,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ba1a1a',
  },
});
