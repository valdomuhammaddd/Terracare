import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/atoms';
import { AuthFormField } from '@/components/molecules';
import { useAuthStore } from '@/store/auth-store';

interface LoginFormProps {
  onSignUpPress?: () => void;
}

export function LoginForm({ onSignUpPress }: LoginFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    await signIn(email.trim(), password);
  };

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  return (
    <View className="w-full max-w-md">
      <AuthFormField
        icon="person"
        placeholder="Masukkan nama lengkap Anda"
        autoComplete="name"
        autoCapitalize="words"
        value={fullName}
        onChangeText={setFullName}
        containerClassName="mb-md"
      />
      <AuthFormField
        icon="mail"
        placeholder="Masukkan email Anda"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        containerClassName="mb-md"
      />
      <AuthFormField
        icon="lock"
        placeholder="Masukkan kata sandi"
        isPassword
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      <View className="mt-2 flex-row justify-end">
        <Pressable accessibilityRole="button" accessibilityLabel="Lupa Kata Sandi">
          <Text className="p-2 text-sm font-bold text-primary">Lupa Kata Sandi?</Text>
        </Pressable>
      </View>

      {error ? (
        <Text className="mt-2 text-center text-sm text-error">{error}</Text>
      ) : null}

      <View className="mt-md">
        <Button
          label="MASUK"
          onPress={handleSubmit}
          disabled={!isFormValid}
          isLoading={isLoading}
        />
      </View>

      <View className="mt-md flex-row items-center justify-center px-4 py-3">
        <Text className="text-body-md text-on-secondary-container">
          Belum punya akun?{' '}
          <Text className="font-bold text-primary" onPress={onSignUpPress}>
            Daftar sekarang
          </Text>
        </Text>
      </View>
    </View>
  );
}
