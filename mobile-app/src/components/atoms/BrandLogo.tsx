import { StyleSheet, Text, View } from 'react-native';

import { authColors } from '@/constants/auth-theme';

interface BrandLogoProps {
  size?: 'sm' | 'lg';
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  titleLg: {
    fontSize: 32,
    letterSpacing: -0.5,
  },
  titleSm: {
    fontSize: 24,
    letterSpacing: -0.5,
  },
  terra: {
    fontWeight: '900',
    color: authColors.brandSlate,
  },
  care: {
    fontWeight: '300',
    color: authColors.primary,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.4,
    color: authColors.onSurfaceVariant,
  },
});

export function BrandLogo({ size = 'lg' }: BrandLogoProps) {
  const titleStyle = size === 'lg' ? styles.titleLg : styles.titleSm;

  return (
    <View style={styles.wrap}>
      <Text style={titleStyle}>
        <Text style={styles.terra}>Terra</Text>
        <Text style={styles.care}>Care</Text>
      </Text>
      <Text style={styles.subtitle}>Smart Triage & Fall Detection</Text>
    </View>
  );
}
