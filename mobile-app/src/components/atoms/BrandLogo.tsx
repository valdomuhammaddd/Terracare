import { Text, View } from 'react-native';

interface BrandLogoProps {
  size?: 'sm' | 'lg';
}

export function BrandLogo({ size = 'lg' }: BrandLogoProps) {
  const titleClass = size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <View className="items-center">
      <Text className={`${titleClass} tracking-tighter`}>
        <Text className="font-black text-brand-slate">Terra</Text>
        <Text className="font-light text-primary">Care</Text>
      </Text>
      <Text className="mt-2 text-center text-sm font-medium tracking-wide text-on-surface-variant">
        Smart Triage & Fall Detection
      </Text>
    </View>
  );
}
