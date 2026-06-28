import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CustomTabBar } from '@/components/organisms/CustomTabBar';
import { SosFab } from '@/components/organisms/SosFab';

export default function TabsLayout() {
  return (
    <View style={styles.root}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5fff7' },
});
