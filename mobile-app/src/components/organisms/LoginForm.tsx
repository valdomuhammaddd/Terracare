import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/atoms';
import { AuthFormField } from '@/components/molecules';
import { authStyles } from '@/constants/auth-theme';
import { useAuthStore } from '@/store/auth-store';

interface LoginFormProps {
  onSignUpPress?: () => void;
}

export function LoginForm({ onSignUpPress }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async () => {
    clearError();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Masukkan email Anda.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Kata sandi minimal 6 karakter.');
      return;
    }

    await signIn(email.trim(), password);
  };

  const displayError = localError ?? error;

  return (
    <View style={{ width: '100%', zIndex: 2 }}>
      <View style={authStyles.fieldGap}>
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
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={authStyles.linkRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lupa Kata Sandi"
          hitSlop={8}
          onPress={() => setLocalError('Fitur reset password akan segera hadir. Hubungi admin.')}
        >
          <Text style={authStyles.forgotLink}>Lupa Kata Sandi?</Text>
        </Pressable>
      </View>

      {displayError ? (
        <View style={authStyles.errorBox}>
          <Text style={authStyles.errorText}>{displayError}</Text>
        </View>
      ) : null}

      <View style={[authStyles.ctaWrap, { zIndex: 10 }]}>
        <Button label="MASUK" onPress={() => void handleSubmit()} isLoading={isLoading} />
      </View>

      <View style={authStyles.switchRow}>
        <Text style={authStyles.switchText}>
          Belum punya akun?{' '}
          <Text style={authStyles.switchLink} onPress={onSignUpPress}>
            Daftar sekarang
          </Text>
        </Text>
      </View>
    </View>
  );
}
