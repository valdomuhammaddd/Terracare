import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ConfirmBottomSheet,
  type ConfirmSheetConfig,
} from '@/components/molecules/ConfirmBottomSheet';
import { Skeleton } from '@/components/atoms/Skeleton';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import type { Device, DeviceUpdate, Profile, ProfileUpdate, UserRole } from '@/types/supabase';
import { hapticLight, hapticMedium } from '@/utils/haptics';
import { isDemoModeActive } from '@/constants/demo-config';
import { MockDataService } from '@/services/MockDataService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'caregiver':
      return 'Keluarga / Caregiver';
    case 'elder':
      return 'Lansia';
    default:
      return 'Pengguna';
  }
}

function showErrorAlert(message: string) {
  Alert.alert('Gagal', message);
}

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  badge?: string;
  danger?: boolean;
  onPress: () => void;
}

function MenuItem({ icon, label, badge, danger, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={() => {
        void hapticLight();
        onPress();
      }}
      className={`flex-row items-center justify-between border-b border-slate-100 px-3 py-4 active:scale-[0.99] ${
        danger ? 'active:bg-rose-50' : 'active:bg-slate-50'
      }`}
    >
      <View className="flex-row items-center gap-3">
        <MaterialIcons name={icon} size={22} color={danger ? '#ef4444' : '#64748b'} />
        <Text className={`text-base font-semibold ${danger ? 'text-rose-600' : 'text-slate-800'}`}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {badge ? (
          <View className="rounded-full bg-primary-fixed/30 px-2 py-0.5">
            <Text className="text-[10px] font-extrabold uppercase tracking-tighter text-primary">
              {badge}
            </Text>
          </View>
        ) : null}
        <MaterialIcons name="chevron-right" size={18} color={danger ? '#fca5a5' : '#94a3b8'} />
      </View>
    </Pressable>
  );
}

interface SettingsFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
}

function SettingsField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: SettingsFieldProps) {
  return (
    <View className="mb-sm">
      <Text className="mb-1 text-sm font-semibold text-on-surface-variant">{label}</Text>
      <TextInput
        className="h-14 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest px-4 text-base font-medium text-on-surface"
        placeholder={placeholder}
        placeholderTextColor="rgba(61, 74, 66, 0.6)"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

interface SectionCardProps {
  title: string;
  children: ReactNode;
  bordered?: boolean;
}

function SectionCard({ title, children, bordered = false }: SectionCardProps) {
  return (
    <View
      className={`mb-md rounded-2xl bg-surface-container-lowest p-md shadow-sm ${
        bordered ? 'border border-slate-200' : ''
      }`}
      style={{ elevation: 2 }}
    >
      <Text className="mb-md text-base font-bold text-on-surface">{title}</Text>
      {children}
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'outline-danger';
}

function ActionButton({
  label,
  onPress,
  isLoading = false,
  variant = 'primary',
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading}
      onPress={onPress}
      className={`h-14 w-full flex-row items-center justify-center rounded-2xl active:scale-[0.98] ${
        isPrimary ? 'bg-primary' : 'border-2 border-red-500 bg-transparent'
      } ${isLoading ? 'opacity-70' : ''}`}
    >
      {isLoading ? (
        <Text className={`text-base font-bold tracking-wide ${isPrimary ? 'text-white' : 'text-red-500'}`}>
          Menyimpan...
        </Text>
      ) : (
        <Text
          className={`text-base font-bold tracking-wide ${
            isPrimary ? 'text-white' : 'text-red-500'
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const authProfile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const [profile, setProfile] = useState<Profile | null>(authProfile);
  const [device, setDevice] = useState<Device | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [sheetConfig, setSheetConfig] = useState<ConfirmSheetConfig | null>(null);

  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [fallThresholdG, setFallThresholdG] = useState('2.5');
  const [angleThresholdDeg, setAngleThresholdDeg] = useState('60');

  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [isSavingDevice, setIsSavingDevice] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [view, setView] = useState<'hub' | 'account'>('hub');

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsBootstrapping(false);
      return;
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileRow) {
      const loadedProfile = profileRow as Profile;
      setProfile(loadedProfile);
      setContact1(loadedProfile.emergency_contact_1 ?? '');
      setContact2(loadedProfile.emergency_contact_2 ?? '');
    }

    const { data: deviceRows } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const primaryDevice = (deviceRows?.[0] ?? null) as Device | null;
    if (primaryDevice) {
      setDevice(primaryDevice);
      setFallThresholdG(String(primaryDevice.fall_threshold_g ?? 2.5));
      setAngleThresholdDeg(String(primaryDevice.angle_threshold_deg ?? 60));
    } else if (isDemoModeActive()) {
      const demoDevice = MockDataService.getDevice(user.id);
      setDevice(demoDevice);
      setFallThresholdG(String(demoDevice.fall_threshold_g));
      setAngleThresholdDeg(String(demoDevice.angle_threshold_deg));
    }

    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleSaveContacts = async () => {
    if (!profile) return;

    void hapticMedium();
    setIsSavingContacts(true);

    const payload: ProfileUpdate = {
      emergency_contact_1: contact1.trim() || null,
      emergency_contact_2: contact2.trim() || null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(payload as never)
      .eq('id', profile.id);

    setIsSavingContacts(false);

    if (error) {
      showErrorAlert(error.message);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            emergency_contact_1: payload.emergency_contact_1 ?? null,
            emergency_contact_2: payload.emergency_contact_2 ?? null,
          }
        : prev,
    );

    setSheetConfig({
      title: 'Berhasil Disimpan',
      message: 'Kontak darurat berhasil diperbarui dan siap digunakan saat insiden.',
      confirmLabel: 'Mengerti',
      variant: 'success',
      onConfirm: () => undefined,
    });
  };

  const handleUpdateDeviceConfig = async () => {
    if (!device) {
      showErrorAlert('Tidak ada perangkat terhubung.');
      return;
    }

    const fallG = parseFloat(fallThresholdG);
    const angleDeg = parseFloat(angleThresholdDeg);

    if (Number.isNaN(fallG) || fallG < 0.5 || fallG > 10) {
      showErrorAlert('Sensitivitas benturan harus antara 0.5 – 10 G.');
      return;
    }

    if (Number.isNaN(angleDeg) || angleDeg < 0 || angleDeg > 90) {
      showErrorAlert('Batas kemiringan harus antara 0 – 90 derajat.');
      return;
    }

    void hapticMedium();
    setIsSavingDevice(true);

    const isDemoDevice = device.id === MockDataService.getDevice().id;

    if (!isDemoDevice) {
      const payload: DeviceUpdate = {
        fall_threshold_g: fallG,
        angle_threshold_deg: angleDeg,
      };

      const { error } = await supabase
        .from('devices')
        .update(payload as never)
        .eq('id', device.id);

      if (error) {
        setIsSavingDevice(false);
        showErrorAlert(error.message);
        return;
      }
    }

    setIsSavingDevice(false);

    setDevice((prev) =>
      prev
        ? {
            ...prev,
            fall_threshold_g: fallG,
            angle_threshold_deg: angleDeg,
          }
        : prev,
    );

    setSheetConfig({
      title: 'Konfigurasi Tersimpan',
      message: isDemoDevice
        ? 'Pengaturan sensor disimpan (mode demo). Perubahan akan disinkronkan ke ESP32 saat perangkat terhubung.'
        : 'Pengaturan sensor telah diperbarui. Perubahan akan disinkronkan ke perangkat ESP32 pada siklus berikutnya.',
      confirmLabel: 'Mengerti',
      variant: 'success',
      onConfirm: () => undefined,
    });
  };

  const openInfoSheet = (title: string, message: string) => {
    setSheetConfig({
      title,
      message,
      confirmLabel: 'Mengerti',
      variant: 'success',
      onConfirm: () => undefined,
    });
  };

  const confirmSignOut = () => {
    setSheetConfig({
      title: 'Keluar dari Akun',
      message: 'Anda yakin ingin keluar? Pemantauan realtime akan dihentikan di perangkat ini.',
      confirmLabel: 'Keluar',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: () => void performSignOut(),
    });
  };

  const performSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    router.replace('/');
  };

  if (isBootstrapping) {
    return (
      <View className="flex-1 bg-background px-container-margin pt-xl">
        <Skeleton height={120} className="mb-lg w-full" />
        <Skeleton height={280} className="w-full" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between bg-surface px-container-margin py-base">
          <View className="flex-row items-center gap-2">
            {view === 'account' ? (
              <Pressable onPress={() => setView('hub')} className="mr-2 rounded-full p-2">
                <MaterialIcons name="arrow-back" size={22} color="#006948" />
              </Pressable>
            ) : (
              <Pressable onPress={() => router.back()} className="mr-2 rounded-full p-2">
                <MaterialIcons name="arrow-back" size={22} color="#006948" />
              </Pressable>
            )}
            <MaterialIcons name="security" size={22} color="#006948" />
            <Text className="text-headline-md font-bold text-on-surface">TerraCare</Text>
          </View>
          <MaterialIcons name="notifications-none" size={24} color="#545f73" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-container-margin pb-xl pt-md"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {profile ? (
            <View className="relative mb-lg overflow-hidden rounded-xl bg-primary-container p-md">
              <View className="flex-row items-center gap-md">
                <View className="h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-primary">
                  <Text className="text-2xl font-bold text-white">{getInitials(profile.full_name)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-headline-md font-bold text-white">{profile.full_name}</Text>
                  <Text className="text-sm text-primary-fixed opacity-90">
                    {formatRoleLabel(profile.role)} • ID: TC-{profile.id.slice(0, 4).toUpperCase()}
                  </Text>
                  <Text className="mt-1 text-xs text-white/80">{profile.email}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {view === 'hub' ? (
            <>
              <Text className="mb-base px-1 text-label-md uppercase tracking-widest text-secondary">
                Pengaturan & Akun
              </Text>
              <View className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-lowest">
                <MenuItem
                  icon="person"
                  label="Informasi Akun"
                  onPress={() => setView('account')}
                />
                <MenuItem icon="shield" label="Keamanan Akun" badge="Baru" onPress={() => openInfoSheet('Keamanan Akun', 'Autentikasi aman via Supabase Auth (JWT). Session disimpan di SecureStore. Row-Level Security memastikan data kesehatan hanya dapat diakses oleh pemilik akun.')} />
                <MenuItem icon="notifications" label="Notifikasi" onPress={() => openInfoSheet('Notifikasi', 'Aktifkan notifikasi push untuk peringatan jatuh dan pembaruan vital sign secara real-time. Fitur ini dapat dikonfigurasi penuh di versi produksi.')} />
                <MenuItem icon="lock" label="Kebijakan Privasi" onPress={() => openInfoSheet('Kebijakan Privasi', 'TerraCare melindungi data kesehatan sesuai UU PDP. Data vital dan insiden darurat hanya dapat diakses oleh caregiver yang terautentikasi melalui Row-Level Security Supabase.')} />
                <MenuItem icon="description" label="Syarat & Ketentuan" onPress={() => openInfoSheet('Syarat & Ketentuan', 'TerraCare adalah alat bantu pemantauan IoT, bukan pengganti diagnosis medis profesional. Pengguna wajib menghubungi layanan darurat 119 saat insiden kritis.')} />
                <MenuItem icon="help-center" label="Pusat Bantuan" onPress={() => openInfoSheet('Pusat Bantuan', 'Butuh bantuan? Email: support@terradigital.id\nTelepon: +62 21 5000-0000\nJam operasional: Senin–Jumat, 09.00–17.00 WIB.')} />
                <MenuItem icon="logout" label="Keluar" danger onPress={confirmSignOut} />
              </View>
            </>
          ) : (
            <>
              <Text className="mb-md text-headline-md font-bold text-on-surface">Profil Pengguna</Text>

              <SectionCard title="Kontak Darurat">
                <SettingsField
                  label="Kontak Darurat 1"
                  value={contact1}
                  onChangeText={setContact1}
                  placeholder="+6281234567890"
                  keyboardType="phone-pad"
                />
                <SettingsField
                  label="Kontak Darurat 2"
                  value={contact2}
                  onChangeText={setContact2}
                  placeholder="+6289876543210"
                  keyboardType="phone-pad"
                />
                <ActionButton
                  label="Simpan Perubahan"
                  onPress={() => void handleSaveContacts()}
                  isLoading={isSavingContacts}
                />
              </SectionCard>

              <SectionCard title="Kalibrasi Perangkat" bordered>
                <Text className="mb-md text-sm text-on-surface-variant">
                  Sensitivitas deteksi jatuh untuk {device?.name ?? 'perangkat'}.
                </Text>
                <SettingsField
                  label="Sensitivitas Benturan (G)"
                  value={fallThresholdG}
                  onChangeText={setFallThresholdG}
                  placeholder="2.5"
                  keyboardType="decimal-pad"
                />
                <SettingsField
                  label="Batas Kemiringan (Derajat)"
                  value={angleThresholdDeg}
                  onChangeText={setAngleThresholdDeg}
                  placeholder="60"
                  keyboardType="decimal-pad"
                />
                <ActionButton
                  label="Simpan Konfigurasi"
                  onPress={() => void handleUpdateDeviceConfig()}
                  isLoading={isSavingDevice}
                />
              </SectionCard>

              <View className="mt-md">
                <ActionButton
                  label="KELUAR DARI AKUN"
                  onPress={confirmSignOut}
                  isLoading={isSigningOut}
                  variant="outline-danger"
                />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <ConfirmBottomSheet config={sheetConfig} onDismiss={() => setSheetConfig(null)} />
    </View>
  );
}
