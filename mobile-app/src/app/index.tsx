import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '@/store/auth-store';
import { AdminDashboardScreen, DashboardScreen, SplashAuthScreen } from '@/screens';

export default function Index() {
  const { isAuthReady, isAuthenticated, userRole, initializeAuth } = useAuthStore();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  if (!isAuthReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#006948" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <SplashAuthScreen />;
  }

  if (userRole === 'admin') {
    return <AdminDashboardScreen />;
  }

  return <DashboardScreen />;
}
