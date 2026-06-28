import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

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
  const [localError, setLocalError] = useState<string | null>(null);
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    setLocalError(null);

    if (fullName.trim().length < 2) {
      setLocalError('Masukkan nama lengkap (min. 2 karakter).');
      return;
    }
    if (!email.trim()) {
      setLocalError('Masukkan email Anda.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Kata sandi minimal 6 karakter.');
      return;
    }

    await signUp(email.trim(), password, fullName.trim());
  };

  const displayError = localError ?? error;

  return (
    <View style={{ width: '100%', zIndex: 2 }}>
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

      {displayError ? (
        <View style={[authStyles.errorBox, { marginTop: 16 }]}>
          <Text style={authStyles.errorText}>{displayError}</Text>
        </View>
      ) : null}

      <View style={[authStyles.ctaWrap, { zIndex: 10 }]}>
        <Button label="DAFTAR" onPress={() => void handleSubmit()} isLoading={isLoading} />
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
