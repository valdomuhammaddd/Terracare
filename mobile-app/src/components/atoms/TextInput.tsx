import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  Pressable,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

type InputIcon = 'person' | 'mail' | 'lock';

const ICON_MAP: Record<InputIcon, keyof typeof MaterialIcons.glyphMap> = {
  person: 'person',
  mail: 'mail',
  lock: 'lock',
};

interface TextInputProps extends RNTextInputProps {
  icon?: InputIcon;
  isPassword?: boolean;
}

export type { TextInputProps };

export function TextInput({
  icon,
  isPassword = false,
  className,
  ...props
}: TextInputProps & { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View
      className={`relative h-14 w-full flex-row items-center rounded-2xl border-2 border-outline-variant bg-surface-container-lowest px-4 shadow-sm ${className ?? ''}`}
    >
      {icon ? (
        <MaterialIcons
          name={ICON_MAP[icon]}
          size={22}
          color="#3d4a42"
          style={{ marginRight: 12 }}
        />
      ) : null}
      <RNTextInput
        className="flex-1 text-base font-medium text-on-surface"
        placeholderTextColor="rgba(61, 74, 66, 0.6)"
        secureTextEntry={isPassword && !isVisible}
        autoCapitalize="none"
        {...props}
      />
      {isPassword ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tampilkan kata sandi"
          onPress={() => setIsVisible((prev) => !prev)}
          className="h-10 w-10 items-center justify-center"
        >
          <MaterialIcons
            name={isVisible ? 'visibility-off' : 'visibility'}
            size={22}
            color="#3d4a42"
          />
        </Pressable>
      ) : null}
    </View>
  );
}
