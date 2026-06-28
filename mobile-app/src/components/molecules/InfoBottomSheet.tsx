import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface InfoSheetConfig {
  title: string;
  message: string;
  confirmLabel?: string;
}

interface InfoBottomSheetProps {
  config: InfoSheetConfig | null;
  onDismiss: () => void;
}

const styles = StyleSheet.create({
  confirmBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#006948',
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3d4a42',
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1c30',
    textAlign: 'center',
  },
});

export function InfoBottomSheet({ config, onDismiss }: InfoBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['50%'], []);

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
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 24 }}
      >
        {config ? (
          <View className="pt-2">
            <View className="mb-4 items-center">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-surface-container-low">
                <MaterialIcons name="info" size={32} color="#006948" />
              </View>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={[styles.message, { marginTop: 12 }]}>{config.message}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => ref.current?.dismiss()}
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.confirmText}>{config.confirmLabel ?? 'Mengerti'}</Text>
            </Pressable>
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
