import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import {
  ConfirmBottomSheet,
  type ConfirmSheetConfig,
} from '@/components/molecules/ConfirmBottomSheet';
import { hapticError } from '@/utils/haptics';

export function SosFab() {
  const [sheetConfig, setSheetConfig] = useState<ConfirmSheetConfig | null>(null);

  const openConfirm = () => {
    void hapticError();
    setSheetConfig({
      title: 'Panggil Bantuan Darurat',
      message:
        'Anda akan dihubungkan ke layanan darurat 119. Pastikan situasi memang memerlukan bantuan medis segera.',
      confirmLabel: 'Panggil 119',
      cancelLabel: 'Batal',
      variant: 'danger',
      onConfirm: () => void Linking.openURL('tel:119'),
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Darurat SOS"
        accessibilityHint="Membuka konfirmasi panggilan darurat"
        onPress={openConfirm}
        className="absolute bottom-24 right-container-margin z-30 h-16 w-16 items-center justify-center rounded-full bg-error shadow-lg active:scale-90"
        style={{ elevation: 8 }}
      >
        <View className="absolute inset-0 rounded-full bg-error/30" />
        <MaterialIcons name="emergency" size={32} color="#ffffff" />
        <Text className="absolute -bottom-1 text-[9px] font-bold text-on-error">SOS</Text>
      </Pressable>

      <ConfirmBottomSheet config={sheetConfig} onDismiss={() => setSheetConfig(null)} />
    </>
  );
}
