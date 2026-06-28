import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.warn('[TerraCare ErrorBoundary]', error.message, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-container-margin">
          <View className="mb-md h-16 w-16 items-center justify-center rounded-full bg-surface-container-low">
            <MaterialIcons name="health-and-safety" size={36} color="#006948" />
          </View>
          <Text className="text-center text-headline-md font-bold text-on-surface">
            TerraCare siap membantu
          </Text>
          <Text className="mt-sm text-center text-body-md leading-relaxed text-on-surface-variant">
            Terjadi gangguan tampilan sementara. Aplikasi tetap aman — silakan muat ulang layar ini.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={this.handleRetry}
            className="mt-xl h-14 w-full max-w-xs items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="text-lg font-bold text-on-primary">Muat Ulang</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
