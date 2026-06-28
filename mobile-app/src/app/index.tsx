import { Redirect } from 'expo-router';

import { AdminDashboardScreen, SplashAuthScreen } from '@/screens';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.userRole);

  if (!isAuthenticated) {
    return <SplashAuthScreen />;
  }

  if (userRole === 'admin') {
    return <AdminDashboardScreen />;
  }

  return <Redirect href="/(tabs)/monitoring" />;
}
