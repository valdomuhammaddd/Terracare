import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/organisms/AppHeader';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';

export function ReportsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const reports = MockDataService.getReports();

  return (
    <View style={styles.screen}>
      <AppHeader profileName={profile?.full_name ?? 'Pengguna'} onAvatarPress={() => router.push('/settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={22} color="#006948" />
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>

        <Text style={styles.title}>Laporan Kesehatan</Text>
        <Text style={styles.subtitle}>Ringkasan vital sign & insiden · mode demo</Text>

        {reports.map((report) => (
          <View key={report.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name={report.type === 'incident' ? 'warning' : 'description'}
                size={24}
                color={report.type === 'incident' ? '#ba1a1a' : '#006948'}
              />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardPeriod}>{report.period}</Text>
              </View>
              <View style={[styles.statusPill, report.status === 'ready' ? styles.ready : styles.archived]}>
                <Text style={styles.statusPillText}>{report.status === 'ready' ? 'Siap' : 'Arsip'}</Text>
              </View>
            </View>
            <Text style={styles.summary}>{report.summary}</Text>
            <Text style={styles.generated}>
              Dibuat:{' '}
              {new Date(report.generatedAt).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bccac0',
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0b1c30' },
  cardPeriod: { fontSize: 13, color: '#586377', marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ready: { backgroundColor: 'rgba(133, 248, 196, 0.4)' },
  archived: { backgroundColor: '#f1f5f9' },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#006948' },
  summary: { marginTop: 14, fontSize: 14, lineHeight: 22, color: '#3d4a42' },
  generated: { marginTop: 10, fontSize: 12, color: '#94a3b8' },
});
