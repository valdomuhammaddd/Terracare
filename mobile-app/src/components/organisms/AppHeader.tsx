import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getInitials } from '@/utils/greeting';

interface AppHeaderProps {
  profileName?: string;
  onAvatarPress?: () => void;
}

export function AppHeader({ profileName, onAvatarPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const initials = profileName ? getInitials(profileName) : '?';

  return (
    <View
      className="border-b border-outline-variant/30 bg-surface"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between px-container-margin py-base">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="security" size={24} color="#006948" />
          <Text className="text-headline-md font-bold tracking-tight text-on-surface">
            TerraCare
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
            className="rounded-full p-2 active:bg-surface-container-high"
          >
            <MaterialIcons name="notifications-none" size={24} color="#545f73" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            onPress={onAvatarPress}
            className="h-10 w-10 items-center justify-center rounded-full border-2 border-primary-container bg-primary-container"
          >
            <Text className="text-sm font-bold text-on-primary-container">{initials}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
