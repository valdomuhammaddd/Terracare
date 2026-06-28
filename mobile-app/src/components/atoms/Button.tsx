import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { authColors } from '@/constants/auth-theme';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'ghost';
  isLoading?: boolean;
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: authColors.primary,
  },
  primaryDisabled: {
    backgroundColor: authColors.surfaceContainerHigh,
  },
  primaryPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#ffffff',
  },
  primaryLabelDisabled: {
    color: 'rgba(61, 74, 66, 0.4)',
  },
});

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  style,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || isLoading;

  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        className={`items-center justify-center rounded-full px-4 py-2 ${className ?? ''}`}
        style={style}
        {...props}
      >
        <Text className="text-sm font-bold text-primary">{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.primary,
        isDisabled && styles.primaryDisabled,
        pressed && !isDisabled && styles.primaryPressed,
        typeof style === 'object' ? style : undefined,
      ]}
      className={className}
      {...props}
    >
      <Text style={[styles.primaryLabel, isDisabled && styles.primaryLabelDisabled]}>
        {isLoading ? 'MEMUAT...' : label}
      </Text>
    </Pressable>
  );
}
