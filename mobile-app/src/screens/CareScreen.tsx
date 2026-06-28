import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import {
  ConfirmBottomSheet,
  type ConfirmSheetConfig,
} from '@/components/molecules/ConfirmBottomSheet';
import { AppHeader } from '@/components/organisms/AppHeader';
import { MockDataService } from '@/services/MockDataService';
import { useAuthStore } from '@/store/auth-store';
import { hapticLight, hapticMedium } from '@/utils/haptics';

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  bgClass: string;
  iconColor: string;
  onPress: () => void;
}

export function CareScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [sheetConfig, setSheetConfig] = useState<ConfirmSheetConfig | null>(null);

  const openInfoSheet = (title: string, message: string) => {
    void hapticLight();
    setSheetConfig({
      title,
      message,
      confirmLabel: 'Mengerti',
      variant: 'success',
      onConfirm: () => undefined,
    });
  };

  const openTrackSheet = () => {
    void hapticLight();
    const gps = MockDataService.getGpsLocation();
    setSheetConfig({
      title: 'Pelacakan Lokasi',
      message: `${gps.label}\n\nKoordinat: ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}\nAkurasi: ±${gps.accuracyMeters} m\n\nMode demo — lokasi simulasi untuk presentasi.`,
      confirmLabel: 'Tutup',
      variant: 'primary',
      onConfirm: () => undefined,
    });
  };

  const openEmergencySheet = () => {
    void hapticMedium();
    setSheetConfig({
      title: 'Darurat Medis',
      message: 'Hubungi layanan darurat 119? Pastikan situasi memerlukan bantuan segera.',
      confirmLabel: 'Panggil 119',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: () => void Linking.openURL('tel:119'),
    });
  };

  const actions: QuickAction[] = [
    {
      id: 'emergency',
      label: 'Emergency',
      icon: 'emergency',
      bgClass: 'bg-primary-container',
      iconColor: '#f5fff7',
      onPress: openEmergencySheet,
    },
    {
      id: 'vitals',
      label: 'Vitals',
      icon: 'favorite',
      bgClass: 'bg-secondary-container',
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
      bgClass: 'bg-surface-container-high',
      iconColor: '#586377',
      onPress: () => {
        void hapticLight();
        router.push('/(tabs)/activity');
      },
    },
    {
      id: 'settings',
      label: 'More',
      icon: 'grid-view',
      bgClass: 'bg-surface-container-high',
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
      bgClass: 'bg-surface-container-high',
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
      bgClass: 'bg-surface-container-high',
      iconColor: '#586377',
      onPress: () => {
        void hapticLight();
        router.push('/settings');
      },
    },
    {
      id: 'medicine',
      label: 'Medicine',
      icon: 'medication',
      bgClass: 'bg-surface-container-high',
      iconColor: '#586377',
      onPress: () =>
        openInfoSheet(
          'Jadwal Obat',
          'Fitur pengingat obat harian akan tersedia di versi berikutnya. Saat ini, pantau vital sign melalui tab Monitoring.',
        ),
    },
    {
      id: 'track',
      label: 'Track',
      icon: 'location-on',
      bgClass: 'bg-surface-container-high',
      iconColor: '#586377',
      onPress: openTrackSheet,
    },
  ];

  const recentLogs = MockDataService.getActivityLogs();

  return (
    <View className="flex-1 bg-background">
      <AppHeader
        profileName={profile?.full_name}
        onAvatarPress={() => {
          void hapticLight();
          router.push('/settings');
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-margin pb-36 pt-md"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-lg rounded-xl border border-outline-variant bg-surface-container-lowest/80 p-md">
          <Text className="text-label-md uppercase tracking-widest text-secondary">Active Monitoring</Text>
          <Text className="mt-1 text-headline-lg-mobile font-bold text-on-surface">
            {profile?.full_name ?? 'Pengguna'}
          </Text>
          <View className="mt-sm flex-row items-center gap-1 self-start rounded-full bg-primary-fixed/30 px-3 py-1">
            <MaterialIcons name="fiber-manual-record" size={12} color="#006948" />
            <Text className="text-xs font-bold text-primary">Live</Text>
          </View>
        </View>

        <Text className="mb-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Menu Pintasan Utama
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {actions.map((action) => (
            <Pressable
              key={action.id}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              className="mb-6 w-[22%] items-center active:scale-95"
            >
              <View
                className={`mb-2 h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${action.bgClass}`}
              >
                <MaterialIcons name={action.icon} size={28} color={action.iconColor} />
              </View>
              <Text className="text-center text-label-md text-on-surface-variant">{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-md flex-row items-center justify-between">
          <Text className="text-headline-md font-semibold text-on-surface">Recent Activity</Text>
          <Pressable
            onPress={() => {
              void hapticLight();
              router.push('/(tabs)/activity');
            }}
          >
            <Text className="text-sm font-semibold text-primary">View History</Text>
          </Pressable>
        </View>
        {recentLogs.map((entry) => (
          <View
            key={entry.id}
            className="mt-sm flex-row items-center rounded-xl border border-outline-variant bg-surface-container-lowest p-md"
          >
            <View className="mr-sm h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MaterialIcons name="history" size={20} color="#006948" />
            </View>
            <View className="flex-1">
              <Text className="text-body-md font-semibold text-on-surface">{entry.message}</Text>
              <Text className="text-xs text-on-surface-variant">
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
    </View>
  );
}
