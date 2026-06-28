import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ConfirmSheetVariant = 'primary' | 'danger' | 'success';

export interface ConfirmSheetConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmSheetVariant;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmBottomSheetProps {
  config: ConfirmSheetConfig | null;
  onDismiss: () => void;
}

export function ConfirmBottomSheet({ config, onDismiss }: ConfirmBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['42%'], []);

  useEffect(() => {
    if (config) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [config]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
    ),
    [],
  );

  const variant = config?.variant ?? 'primary';
  const confirmBg =
    variant === 'danger' ? 'bg-error' : variant === 'success' ? 'bg-primary-container' : 'bg-primary';
  const confirmText =
    variant === 'success' ? 'text-on-primary-container' : 'text-on-primary';

  const iconName =
    variant === 'danger' ? 'emergency' : variant === 'success' ? 'check-circle' : 'info';

  const iconColor = variant === 'danger' ? '#ba1a1a' : '#006948';

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onDismiss}
      handleIndicatorStyle={{ backgroundColor: '#bccac0', width: 48 }}
      backgroundStyle={{
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      accessibilityViewIsModal
    >
      <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {config ? (
          <View className="px-container-margin pt-sm">
            <View className="mb-md items-center">
              <View className="mb-sm h-14 w-14 items-center justify-center rounded-full bg-surface-container-low">
                <MaterialIcons name={iconName} size={32} color={iconColor} />
              </View>
              <Text
                className="text-center text-xl font-bold text-on-surface"
                accessibilityRole="header"
              >
                {config.title}
              </Text>
              <Text className="mt-sm text-center text-body-lg leading-relaxed text-on-surface-variant">
                {config.message}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={config.confirmLabel}
              onPress={() => {
                config.onConfirm();
                ref.current?.dismiss();
              }}
              className={`mb-sm h-14 w-full items-center justify-center rounded-2xl ${confirmBg} active:opacity-90`}
            >
              <Text className={`text-lg font-bold ${confirmText}`}>{config.confirmLabel}</Text>
            </Pressable>

            {config.cancelLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  config.onCancel?.();
                  ref.current?.dismiss();
                }}
                className="h-14 w-full items-center justify-center rounded-2xl border-2 border-outline-variant active:bg-surface-container-low"
              >
                <Text className="text-base font-bold text-on-surface">{config.cancelLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
