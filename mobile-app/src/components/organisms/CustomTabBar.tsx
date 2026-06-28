import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hapticLight } from '@/utils/haptics';

const TABS = [
  { name: 'monitoring', label: 'Monitoring', icon: 'favorite' as const },
  { name: 'insights', label: 'Insights', icon: 'bar-chart' as const },
  { name: 'activity', label: 'Activity', icon: 'directions-walk' as const },
  { name: 'care', label: 'Care', icon: 'medical-services' as const },
] as const;

interface TabRoute {
  key: string;
  name: string;
}

interface CustomTabBarProps {
  state: { index: number; routes: TabRoute[] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-outline-variant/40 bg-surface-container-lowest shadow-sm"
      style={{ paddingBottom: Math.max(insets.bottom, 12), borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
    >
      <View className="h-20 flex-row items-center justify-around px-4">
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
          const isFocused = state.index === index;

          const onPress = () => {
            void hapticLight();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              onPress={onPress}
              className={`items-center justify-center px-4 py-1 ${
                isFocused ? 'rounded-full bg-primary-container' : ''
              }`}
            >
              <MaterialIcons
                name={tab.icon}
                size={24}
                color={isFocused ? '#f5fff7' : '#586377'}
              />
              <Text
                className={`mt-1 text-[11px] font-medium tracking-tight ${
                  isFocused ? 'text-on-primary-container' : 'text-on-secondary-container'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
