import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';

import { authColors } from '@/constants/auth-theme';

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

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: authColors.surfaceContainerLowest,
    paddingHorizontal: 16,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  containerFocused: {
    borderColor: authColors.primary,
    shadowColor: authColors.primaryFixed,
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  containerBlurred: {
    borderColor: authColors.outlineVariant,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: authColors.onSurface,
    paddingVertical: 0,
  },
  toggle: {
    position: 'absolute',
    right: 8,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function TextInput({
  icon,
  isPassword = false,
  className,
  onFocus,
  onBlur,
  style,
  ...props
}: TextInputProps & { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused ? styles.containerFocused : styles.containerBlurred,
      ]}
      className={className}
    >
      {icon ? (
        <MaterialIcons
          name={ICON_MAP[icon]}
          size={22}
          color={isFocused ? authColors.primary : authColors.onSurfaceVariant}
          style={{ marginRight: 12 }}
        />
      ) : null}
      <RNTextInput
        style={[styles.input, style]}
        placeholderTextColor="rgba(61, 74, 66, 0.55)"
        secureTextEntry={isPassword && !isVisible}
        autoCapitalize="none"
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {isPassword ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tampilkan kata sandi"
          onPress={() => setIsVisible((prev) => !prev)}
          style={styles.toggle}
        >
          <MaterialIcons
            name={isVisible ? 'visibility-off' : 'visibility'}
            size={22}
            color={authColors.onSurfaceVariant}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
