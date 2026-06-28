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
  const displayName = profileName?.trim() || 'Pengguna';
  const initials = getInitials(displayName);

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
            onPress={onNotificationPress ?? (() => undefined)}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialIcons name="notifications-none" size={24} color="#545f73" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            onPress={onAvatarPress ?? (() => undefined)}
            hitSlop={8}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <MaterialIcons name="person" size={20} color="#f5fff7" style={styles.avatarIcon} />
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    zIndex: 999,
    elevation: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(188, 202, 192, 0.3)',
    backgroundColor: '#f8f9ff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 20, fontWeight: '700', color: '#0b1c30' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 101,
  },
  iconBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  avatar: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00855d',
    backgroundColor: '#00855d',
    overflow: 'visible',
  },
  avatarIcon: {
    position: 'absolute',
    opacity: 0.35,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#f5fff7',
    zIndex: 1,
  },
  pressed: { opacity: 0.75 },
});
