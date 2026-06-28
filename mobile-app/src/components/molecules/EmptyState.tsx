import { Pressable, Text, View } from 'react-native';

import { ShieldIcon } from '@/components/atoms/ShieldIcon';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULT_MESSAGE =
  'Sistem aktif & memantau. Data kesehatan akan segera muncul.';

export function EmptyState({
  title = 'Menunggu Data',
  message = DEFAULT_MESSAGE,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      className="items-center rounded-2xl border-2 border-primary/25 bg-surface-container-lowest px-lg py-xl"
      accessibilityRole="text"
      accessibilityLabel={`${title}. ${message}`}
    >
      <View className="mb-md h-24 w-24 items-center justify-center rounded-full bg-primary-container/15">
        <ShieldIcon size={56} />
      </View>
      <Text className="text-center text-headline-md font-bold text-on-surface">{title}</Text>
      <Text className="mt-sm max-w-xs text-center text-body-lg leading-relaxed text-on-surface-variant">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          className="mt-lg h-12 min-w-[160px] items-center justify-center rounded-2xl bg-primary px-lg active:opacity-90"
        >
          <Text className="text-base font-bold text-on-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
