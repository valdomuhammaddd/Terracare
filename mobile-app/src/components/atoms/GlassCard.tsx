import { View, type ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  className?: string;
}

export function GlassCard({ children, className, style, ...props }: GlassCardProps) {
  return (
    <View
      className={`rounded-xl border border-surface-dim/50 bg-white/70 p-md ${className ?? ''}`}
      style={[{ backgroundColor: 'rgba(255, 255, 255, 0.72)' }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
