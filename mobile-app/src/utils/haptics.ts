import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function runHaptic(action: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  try {
    await action();
  } catch {
    // Simulators may not support haptics.
  }
}

export function hapticLight() {
  return runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticMedium() {
  return runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function hapticError() {
  return runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
}

export function hapticSuccess() {
  return runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}
