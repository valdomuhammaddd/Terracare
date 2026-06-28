import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Kalibrasi Berhasil',
    body: 'Sensor jatuh disetel ke 2.5G. Sinkronisasi ke Hub-Alpha-01 selesai.',
    icon: 'tune' as const,
  },
  {
    id: '2',
    title: 'Alat Aktif',
    body: 'Perangkat online. Pemantauan vital sign berjalan normal.',
    icon: 'sensors' as const,
  },
];

interface NotificationSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function NotificationSheet({ visible, onDismiss }: NotificationSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['45%'], []);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.55} />
    ),
    [],
  );

  if (!visible) {
    return null;
  }

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
      <BottomSheetView style={{ paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 24 }}>
        <Text style={styles.title}>Notifikasi</Text>
        {NOTIFICATIONS.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.iconWrap}>
              <MaterialIcons name={item.icon} size={22} color="#006948" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowBody}>{item.body}</Text>
            </View>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => ref.current?.dismiss()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.closeText}>Tutup</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b1c30',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5eeff',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#0b1c30' },
  rowBody: { fontSize: 14, lineHeight: 20, color: '#586377', marginTop: 4 },
  closeBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#006948',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
