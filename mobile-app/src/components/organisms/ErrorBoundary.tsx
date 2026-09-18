import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="health-and-safety" size={36} color="#006948" />
          </View>
          <Text style={styles.title}>TerraCare siap membantu</Text>
          <Text style={styles.message}>
            Terjadi gangguan tampilan sementara. Aplikasi tetap aman — silakan muat ulang layar ini.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Muat Ulang"
            onPress={this.handleRetry}
            style={({ pressed }) => [styles.retryBtn, pressed && styles.retryPressed]}
          >
            <Text style={styles.retryLabel}>Muat Ulang</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5fff7',
    paddingHorizontal: 24,
  },
  iconWrap: {
    marginBottom: 16,
    height: 64,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: '#e8ecf4',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#0b1c30',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#586377',
    maxWidth: 320,
  },
  retryBtn: {
    position: 'relative',
    marginTop: 32,
    height: 56,
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#006948',
    zIndex: 999,
    elevation: 12,
  },
  retryPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  retryLabel: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
});
