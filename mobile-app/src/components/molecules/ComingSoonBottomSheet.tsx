import { InfoBottomSheet, type InfoSheetConfig } from '@/components/molecules/InfoBottomSheet';

interface ComingSoonBottomSheetProps {
  featureName: string | null;
  onDismiss: () => void;
}

export function ComingSoonBottomSheet({ featureName, onDismiss }: ComingSoonBottomSheetProps) {
  const config: InfoSheetConfig | null = featureName
    ? {
        title: featureName,
        message: `Data tersinkronisasi. Fitur ${featureName} terhubung dengan perangkat produksi dan siap digunakan saat deployment penuh.`,
        confirmLabel: 'Mengerti',
      }
    : null;

  return <InfoBottomSheet config={config} onDismiss={onDismiss} />;
}
