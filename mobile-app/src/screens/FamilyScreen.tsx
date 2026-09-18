import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/organisms/AppHeader';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';

export function FamilyScreen() {
  const profile = useAuthStore((s) => s.profile);
  const members = MockDataService.getFamilyMembers();
  const primary = MockDataService.getPrimaryContact();

  return (
    <View style={styles.screen}>
      <AppHeader profileName={profile?.full_name ?? 'Pengguna'} onAvatarPress={() => router.push('/settings')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={22} color="#006948" />
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>

        <Text style={styles.title}>Kontak Keluarga</Text>
        <Text style={styles.subtitle}>Notifikasi darurat dikirim ke kontak utama</Text>

        <View style={styles.primaryCard}>
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>KONTAK UTAMA</Text>
          </View>
          <View style={styles.primaryRow}>
            <View style={styles.avatarLg}>
              <Text style={styles.avatarLgText}>{primary.avatarInitials}</Text>
            </View>
            <View style={styles.primaryBody}>
              <Text style={styles.primaryName}>{primary.name}</Text>
              <Text style={styles.primaryRelation}>{primary.relation}</Text>
              <Text style={styles.primaryPhone}>{primary.phone}</Text>
            </View>
          </View>
          {primary.lastNotifiedAt ? (
            <Text style={styles.notified}>
              Terakhir dinotifikasi:{' '}
              {new Date(primary.lastNotifiedAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Anggota Keluarga</Text>
        {members
          .filter((m) => !m.isPrimary)
          .map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.avatarSm}>
                <Text style={styles.avatarSmText}>{member.avatarInitials}</Text>
              </View>
              <View style={styles.memberBody}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberMeta}>{member.relation} · {member.phone}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
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
  primaryCard: {
    borderRadius: 16,
    backgroundColor: '#006948',
    padding: 20,
    marginBottom: 24,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  primaryBadgeText: { fontSize: 10, fontWeight: '800', color: '#f5fff7', letterSpacing: 1 },
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarLg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLgText: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  primaryBody: { flex: 1 },
  primaryName: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  primaryRelation: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  primaryPhone: { fontSize: 15, fontWeight: '600', color: '#85f8c4', marginTop: 6 },
  notified: { marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#586377',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bccac0',
    padding: 16,
    marginBottom: 10,
  },
  avatarSm: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarSmText: { fontSize: 14, fontWeight: '700', color: '#006948' },
  memberBody: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '700', color: '#0b1c30' },
  memberMeta: { fontSize: 13, color: '#586377', marginTop: 2 },
});
