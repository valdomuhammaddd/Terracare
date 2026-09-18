import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/organisms/AppHeader';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';

const statusColors = {
  taken: { bg: '#dcfce7', text: '#166534', label: 'Sudah Minum' },
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Menunggu' },
  missed: { bg: '#fee2e2', text: '#991b1b', label: 'Terlewat' },
};

export function MedicineScreen() {
  const profile = useAuthStore((s) => s.profile);
  const schedule = MockDataService.getMedicineSchedule();

  return (
    <View style={styles.screen}>
      <AppHeader profileName={profile?.full_name ?? 'Pengguna'} onAvatarPress={() => router.push('/settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={22} color="#006948" />
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>

        <Text style={styles.title}>Jadwal Obat</Text>
        <Text style={styles.subtitle}>Pengingat harian · disinkronkan dengan perangkat</Text>

        {schedule.map((med) => {
          const colors = statusColors[med.status];
          return (
            <View key={med.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <MaterialIcons name="medication" size={24} color="#006948" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>{med.dose} · {med.schedule}</Text>
                {med.lastTakenAt ? (
                  <Text style={styles.medTime}>
                    Terakhir:{' '}
                    {new Date(med.lastTakenAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>{colors.label}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5fff7' },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  backText: { fontSize: 16, fontWeight: '600', color: '#006948' },
  title: { fontSize: 24, fontWeight: '800', color: '#0b1c30' },
  subtitle: { marginTop: 4, fontSize: 15, color: '#586377', marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bccac0',
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eff4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  medName: { fontSize: 16, fontWeight: '700', color: '#0b1c30' },
  medDose: { fontSize: 13, color: '#586377', marginTop: 4 },
  medTime: { fontSize: 12, color: '#006948', marginTop: 4, fontWeight: '600' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
});
