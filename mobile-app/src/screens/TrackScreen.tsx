import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/organisms/AppHeader';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';

export function TrackScreen() {
  const profile = useAuthStore((s) => s.profile);
  const gps = MockDataService.getGpsLocation();

  return (
    <View style={styles.screen}>
      <AppHeader
        profileName={profile?.full_name ?? 'Pengguna'}
        onAvatarPress={() => router.push('/settings')}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={22} color="#006948" />
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>

        <Text style={styles.title}>Live Tracking</Text>
        <Text style={styles.subtitle}>Pelacakan lokasi perangkat TerraCare Hub</Text>

        <View style={styles.mapWrap}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 48 }).map((_, i) => (
              <View
                key={i}
                style={[styles.gridCell, i % 7 === 0 && styles.gridRoadH, i % 11 === 0 && styles.gridRoadV]}
              />
            ))}
          </View>
          <View style={styles.mapOverlay}>
            <View style={styles.markerPulse} />
            <View style={styles.marker}>
              <MaterialIcons name="location-on" size={32} color="#ffffff" />
            </View>
          </View>
          <View style={styles.mapLabel}>
            <MaterialIcons name="place" size={16} color="#006948" />
            <Text style={styles.mapLabelText}>{gps.label}</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <MaterialIcons name="gps-fixed" size={22} color="#006948" />
            <Text style={styles.statusTitle}>Status: Live Tracking | GPS: Aktif</Text>
          </View>
          <Text style={styles.statusDetail}>
            {gps.street}, {gps.city}
          </Text>
          <Text style={styles.statusMeta}>
            Koordinat: {gps.latitude.toFixed(4)}, {gps.longitude.toFixed(4)} · Akurasi ±
            {gps.accuracyMeters} m
          </Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Sinkronisasi realtime · Mode Demo</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5fff7' },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 },
  backText: { fontSize: 16, fontWeight: '600', color: '#006948' },
  title: { fontSize: 24, fontWeight: '800', color: '#0b1c30' },
  subtitle: { marginTop: 4, fontSize: 15, color: '#586377', marginBottom: 20 },
  mapWrap: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#dce9ff',
    borderWidth: 1,
    borderColor: '#bccac0',
  },
  mapGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '12.5%',
    height: '16.66%',
    backgroundColor: '#e8f0e8',
    borderWidth: 0.5,
    borderColor: 'rgba(0,105,72,0.06)',
  },
  gridRoadH: { backgroundColor: '#f0f4ff' },
  gridRoadV: { backgroundColor: '#eef6f2' },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
  },
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  mapLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mapLabelText: { fontSize: 13, fontWeight: '700', color: '#0b1c30', flex: 1 },
  statusCard: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bccac0',
    padding: 20,
    elevation: 4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#006948', flex: 1 },
  statusDetail: { marginTop: 10, fontSize: 15, fontWeight: '600', color: '#0b1c30' },
  statusMeta: { marginTop: 6, fontSize: 13, color: '#586377', lineHeight: 20 },
  liveRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#006948' },
  liveText: { fontSize: 12, fontWeight: '700', color: '#006948', textTransform: 'uppercase' },
});
