import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/atoms';
import { AuthFormField } from '@/components/molecules';
import { authStyles } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';

interface RegisterFormProps {
  onLoginPress?: () => void;
}

export function RegisterForm({ onLoginPress }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    await signUp(email.trim(), password, fullName.trim());
  };

  const isFormValid =
    fullName.trim().length >= 2 && email.trim().length > 0 && password.length >= 6;

  return (
    <View className="w-full">
      <View style={authStyles.fieldGap}>
        <AuthFormField
          icon="person"
          placeholder="Masukkan nama lengkap Anda"
          autoComplete="name"
          autoCapitalize="words"
          textContentType="name"
          value={fullName}
          onChangeText={setFullName}
        />
        <AuthFormField
          icon="mail"
          placeholder="Masukkan email Anda"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <AuthFormField
          icon="lock"
          placeholder="Masukkan kata sandi"
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {error ? (
        <View style={[authStyles.errorBox, { marginTop: 16 }]}>
          <Text style={authStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={authStyles.ctaWrap}>
        <Button
          label="DAFTAR"
          onPress={handleSubmit}
          disabled={!isFormValid}
          isLoading={isLoading}
        />
      </View>

      <View style={authStyles.switchRow}>
        <Text style={authStyles.switchText}>
          Sudah punya akun?{' '}
          <Text style={authStyles.switchLink} onPress={onLoginPress}>
            Masuk sekarang
          </Text>
        </Text>
      </View>
    </View>
  );
}
