import { Image } from 'expo-image';
import { Text, View } from 'react-native';

const HERO_IMAGE = require('../../../assets/images/tutorial-web.png');

export function AuthHeroBanner() {
  return (
    <View className="aspect-video w-full overflow-hidden rounded-2xl shadow-xl">
      <Image
        source={HERO_IMAGE}
        className="h-full w-full"
        contentFit="cover"
        accessibilityLabel="Antarmuka pemantauan kesehatan di rumah modern"
      />
      <View className="absolute inset-0 justify-end bg-black/35">
        <View className="p-lg pt-16">
          <Text className="mb-2 text-headline-lg font-semibold text-white">
            Designed for Dignity
          </Text>
          <Text className="text-body-md leading-relaxed text-white/90">
            Our interfaces prioritize clarity and hit targets, ensuring technology serves
            humanity, not the other way around.
          </Text>
        </View>
      </View>
    </View>
  );
}
