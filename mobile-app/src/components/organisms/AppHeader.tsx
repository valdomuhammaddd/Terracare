import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getInitials } from '@/utils/greeting';

interface AppHeaderProps {
  profileName?: string;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
}

export function AppHeader({ profileName, onAvatarPress, onNotificationPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const initials = profileName ? getInitials(profileName) : '?';

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <MaterialIcons name="security" size={24} color="#006948" />
          <Text style={styles.brandText}>TerraCare</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifikasi"
            onPress={onNotificationPress}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="notifications-none" size={24} color="#545f73" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            onPress={onAvatarPress}
            hitSlop={8}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(188, 202, 192, 0.3)',
    backgroundColor: '#f8f9ff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 20, fontWeight: '700', color: '#0b1c30' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { padding: 8, borderRadius: 20 },
  avatar: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00855d',
    backgroundColor: '#00855d',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#f5fff7' },
  pressed: { opacity: 0.75 },
});
