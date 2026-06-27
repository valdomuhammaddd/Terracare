import { Pressable, Text, type PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'ghost';
  isLoading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const isDisabled = disabled || isLoading;

  const baseClass =
    variant === 'primary'
      ? 'h-14 w-full items-center justify-center rounded-2xl bg-primary active:scale-[0.98]'
      : 'items-center justify-center rounded-full px-4 py-2';

  const textClass =
    variant === 'primary'
      ? 'text-lg font-bold tracking-wider text-on-primary'
      : 'text-sm font-bold text-primary';

  const disabledClass = isDisabled
    ? variant === 'primary'
      ? 'bg-surface-container-high'
      : 'opacity-50'
    : '';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`${baseClass} ${disabledClass} ${className ?? ''}`}
      {...props}
    >
      <Text className={`${textClass} ${isDisabled && variant === 'primary' ? 'text-on-surface-variant/40' : ''}`}>
        {isLoading ? 'MEMUAT...' : label}
      </Text>
    </Pressable>
  );
}
