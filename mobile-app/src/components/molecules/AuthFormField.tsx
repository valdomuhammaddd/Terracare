import { TextInput } from '@/components/atoms/TextInput';
import type { TextInputProps } from '@/components/atoms/TextInput';
import { View } from 'react-native';

interface AuthFormFieldProps extends TextInputProps {
  containerClassName?: string;
}

export function AuthFormField({ containerClassName, ...props }: AuthFormFieldProps) {
  return (
    <View className={containerClassName}>
      <TextInput {...props} />
    </View>
  );
}
