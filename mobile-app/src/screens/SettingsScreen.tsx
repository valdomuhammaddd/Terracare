import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/hanken-grotesk';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import type { Device, DeviceUpdate, Profile, ProfileUpdate, UserRole } from '@/types/supabase';

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

function showSuccessAlert(message: string) {
  Alert.alert('Berhasil', message);
}

function showErrorAlert(message: string) {
  Alert.alert('Gagal', message);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

interface ProfileCardProps {
  profile: Profile;
}

function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <View
      className="mb-md flex-row items-center rounded-2xl bg-surface-container-lowest p-md shadow-sm"
      style={{ elevation: 2 }}
    >
      <View className="mr-md h-16 w-16 items-center justify-center rounded-full bg-primary-container">
        <Text className="text-xl font-bold text-on-primary-container">
          {getInitials(profile.full_name)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-on-surface">{profile.full_name}</Text>
        <Text className="mt-0.5 text-sm text-on-surface-variant">{profile.email}</Text>
        <View className="mt-2 self-start rounded-full bg-surface-container px-3 py-1">
          <Text className="text-xs font-bold text-primary">{formatRoleLabel(profile.role)}</Text>
        </View>
      </View>
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
        isPrimary
          ? 'bg-emerald-500'
          : 'border-2 border-red-500 bg-transparent'
      } ${isLoading ? 'opacity-70' : ''}`}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#ef4444'} />
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
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  const authProfile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const [profile, setProfile] = useState<Profile | null>(authProfile);
  const [device, setDevice] = useState<Device | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [fallThresholdG, setFallThresholdG] = useState('2.5');
  const [angleThresholdDeg, setAngleThresholdDeg] = useState('60');

  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [isSavingDevice, setIsSavingDevice] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    }

    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const handleSaveContacts = async () => {
    if (!profile) return;

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

    showSuccessAlert('Kontak darurat berhasil disimpan.');
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

    setIsSavingDevice(true);

    const payload: DeviceUpdate = {
      fall_threshold_g: fallG,
      angle_threshold_deg: angleDeg,
    };

    const { error } = await supabase
      .from('devices')
      .update(payload as never)
      .eq('id', device.id);

    setIsSavingDevice(false);

    if (error) {
      showErrorAlert(error.message);
      return;
    }

    setDevice((prev) =>
      prev
        ? {
            ...prev,
            fall_threshold_g: fallG,
            angle_threshold_deg: angleDeg,
          }
        : prev,
    );

    showSuccessAlert('Konfigurasi sensor berhasil diperbarui.');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    router.replace('/');
  };

  if (!fontsLoaded || isBootstrapping) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006948" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View
          className="bg-surface-container-lowest px-container-margin pb-md pt-sm shadow-sm"
          style={{ elevation: 3 }}
        >
          <View className="flex-row items-center gap-sm">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              onPress={() => router.back()}
              className="rounded-full bg-surface-container-high p-2"
            >
              <MaterialIcons name="arrow-back" size={22} color="#0b1c30" />
            </Pressable>
            <Text className="text-headline-lg-mobile font-bold text-on-surface">Pengaturan</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-container-margin pb-xl pt-md"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {profile ? <ProfileCard profile={profile} /> : null}

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
              label="Simpan Kontak"
              onPress={() => void handleSaveContacts()}
              isLoading={isSavingContacts}
            />
          </SectionCard>

          <SectionCard title="Konfigurasi Sensor (Dev Mode)" bordered>
            <Text className="mb-md text-sm text-on-surface-variant">
              Sesuaikan ambang deteksi jatuh untuk perangkat{' '}
              {device?.name ?? '—'}. Nilai ini disinkronkan ke ESP32 pada siklus
              berikutnya.
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
              label="Update Konfigurasi Alat"
              onPress={() => void handleUpdateDeviceConfig()}
              isLoading={isSavingDevice}
            />
          </SectionCard>

          <View className="mt-md">
            <ActionButton
              label="Keluar Akun"
              onPress={() => void handleSignOut()}
              isLoading={isSigningOut}
              variant="outline-danger"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
