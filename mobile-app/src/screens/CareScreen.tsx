import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  ConfirmBottomSheet,
  type ConfirmSheetConfig,
} from '@/components/molecules/ConfirmBottomSheet';
import { ComingSoonBottomSheet } from '@/components/molecules/ComingSoonBottomSheet';
import { AppHeader } from '@/components/organisms/AppHeader';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';
import { useEmergencyUiStore } from '@/store/emergency-ui-store';
import { hapticLight, hapticMedium } from '@/utils/haptics';

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bgColor: string;
  iconColor: string;
  onPress: () => void;
}

export function CareScreen() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const startFamilyAlert = useEmergencyUiStore((s) => s.startFamilyAlert);
  const [sheetConfig, setSheetConfig] = useState<ConfirmSheetConfig | null>(null);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  const openComingSoon = (featureName: string) => {
    void hapticLight();
    setComingSoonFeature(featureName);
  };

  const openEmergencySheet = () => {
    void hapticMedium();
    setSheetConfig({
      title: 'Darurat — Hubungi Keluarga',
      message:
        'Sinyal SOS akan dikirim ke kontak keluarga terdaftar dan dicatat di sistem TerraCare. Lanjutkan?',
      confirmLabel: 'Kirim SOS',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: () => {
        setSheetConfig(null);
        if (user?.id) {
          void startFamilyAlert(user.id);
        }
      },
    });
  };

  const actions: QuickAction[] = [
    {
      id: 'emergency',
      label: 'Emergency',
      icon: 'emergency',
      bgColor: '#006948',
      iconColor: '#f5fff7',
      onPress: openEmergencySheet,
    },
    {
      id: 'vitals',
      label: 'Vitals',
      icon: 'favorite',
      bgColor: '#d7e3ff',
      iconColor: '#586377',
      onPress: () => {
        void hapticLight();
        router.push('/(tabs)/monitoring');
      },
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'event-note',
      bgColor: '#e8ecf4',
      iconColor: '#586377',
      onPress: () => openComingSoon('Reports'),
    },
    {
      id: 'settings',
      label: 'More',
      icon: 'grid-view',
      bgColor: '#e8ecf4',
      iconColor: '#586377',
      onPress: () => {
        void hapticLight();
        router.push('/settings');
      },
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: 'bar-chart',
      bgColor: '#e8ecf4',
      iconColor: '#586377',
      onPress: () => {
        void hapticLight();
        router.push('/(tabs)/insights');
      },
    },
    {
      id: 'family',
      label: 'Family',
      icon: 'people',
      bgColor: '#e8ecf4',
      iconColor: '#586377',
      onPress: () => openComingSoon('Family'),
    },
    {
      id: 'medicine',
      label: 'Medicine',
      icon: 'medication',
      bgColor: '#e8ecf4',
      iconColor: '#586377',
      onPress: () => openComingSoon('Medicine'),
    },
    {
      id: 'track',
      label: 'Track',
      icon: 'location-on',
      bgColor: '#e8ecf4',
      iconColor: '#586377',
      onPress: () => openComingSoon('Track'),
    },
  ];

  const recentLogs = MockDataService.getActivityLogs();

  return (
    <View style={styles.screen}>
      <AppHeader
        profileName={profile?.full_name}
        onAvatarPress={() => {
          void hapticLight();
          router.push('/settings');
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Active Monitoring</Text>
          <Text style={styles.heroName}>{profile?.full_name ?? 'Pengguna'}</Text>
          <View style={styles.liveBadge}>
            <MaterialIcons name="fiber-manual-record" size={12} color="#006948" />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Menu Pintasan Utama</Text>
        <View style={styles.grid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={styles.gridItem}
            >
              <View style={[styles.gridIcon, { backgroundColor: action.bgColor }]}>
                <MaterialIcons name={action.icon} size={28} color={action.iconColor} />
              </View>
              <Text style={styles.gridLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Activity</Text>
          <Pressable
            onPress={() => {
              void hapticLight();
              router.push('/(tabs)/activity');
            }}
            hitSlop={8}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Text style={styles.viewHistory}>View History</Text>
          </Pressable>
        </View>
        {recentLogs.map((entry) => (
          <View key={entry.id} style={styles.logRow}>
            <View style={styles.logIcon}>
              <MaterialIcons name="history" size={20} color="#006948" />
            </View>
            <View style={styles.logBody}>
              <Text style={styles.logMessage}>{entry.message}</Text>
              <Text style={styles.logTime}>
                {new Date(entry.at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <ConfirmBottomSheet config={sheetConfig} onDismiss={() => setSheetConfig(null)} />
      <ComingSoonBottomSheet
        featureName={comingSoonFeature}
        onDismiss={() => setComingSoonFeature(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5fff7' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 144 },
  heroCard: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bccac0',
    backgroundColor: 'rgba(248, 249, 255, 0.8)',
    padding: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#586377',
  },
  heroName: {
    marginTop: 4,
    fontSize: 24,
    fontWeight: '700',
    color: '#0b1c30',
  },
  liveBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(133, 248, 196, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  liveText: { fontSize: 12, fontWeight: '700', color: '#006948' },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#586377',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 88,
  },
  gridIcon: {
    marginBottom: 8,
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#586377',
  },
  recentHeader: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTitle: { fontSize: 18, fontWeight: '600', color: '#0b1c30' },
  viewHistory: { fontSize: 14, fontWeight: '600', color: '#006948' },
  logRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bccac0',
    backgroundColor: '#f8f9ff',
    padding: 16,
  },
  logIcon: {
    marginRight: 12,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 105, 72, 0.1)',
  },
  logBody: { flex: 1 },
  logMessage: { fontSize: 16, fontWeight: '600', color: '#0b1c30' },
  logTime: { fontSize: 12, color: '#586377' },
});
