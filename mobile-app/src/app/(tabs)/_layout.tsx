import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { CustomTabBar } from '@/components/organisms/CustomTabBar';
import { SosFab } from '@/components/organisms/SosFab';

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-background">
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="monitoring" options={{ title: 'Monitoring' }} />
        <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
        <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
        <Tabs.Screen name="care" options={{ title: 'Care' }} />
      </Tabs>
      <SosFab />
    </View>
  );
}
