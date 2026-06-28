import { useState } from 'react';
import { View } from 'react-native';

import { useAuthStore } from '@/store/auth-store';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const clearError = useAuthStore((state) => state.clearError);

  const switchToRegister = () => {
    clearError();
    setMode('register');
  };

  const switchToLogin = () => {
    clearError();
    setMode('login');
  };

  return (
    <View className="w-full max-w-md self-center">
      {mode === 'login' ? (
        <LoginForm onSignUpPress={switchToRegister} />
      ) : (
        <RegisterForm onLoginPress={switchToLogin} />
      )}
    </View>
  );
}
