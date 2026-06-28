import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text, View } from 'react-native';

export function AuthTopBar() {
  return (
    <View className="flex-row items-center justify-between px-container-margin py-base">
      <View className="flex-row items-center gap-2">
        <MaterialIcons name="security" size={24} color="#006948" />
        <Text className="text-headline-md font-bold text-on-surface">TerraCare</Text>
      </View>
    </View>
  );
}
