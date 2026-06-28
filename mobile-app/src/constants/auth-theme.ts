import { StyleSheet } from 'react-native';

export const authColors = {
  background: '#f8f9ff',
  surface: '#ffffff',
  primary: '#006948',
  primaryFixed: '#85f8c4',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#3d4a42',
  outlineVariant: '#bccac0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#dce9ff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  brandSlate: '#1e293b',
} as const;

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: authColors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(203, 219, 245, 0.6)',
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  tagline: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: authColors.onSurfaceVariant,
    maxWidth: 320,
  },
  fieldGap: {
    gap: 16,
  },
  linkRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  forgotLink: {
    fontSize: 14,
    fontWeight: '700',
    color: authColors.primary,
    paddingVertical: 8,
  },
  errorBox: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: authColors.errorContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    color: authColors.onErrorContainer,
  },
  ctaWrap: {
    marginTop: 20,
  },
  switchRow: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 16,
    color: '#586377',
    textAlign: 'center',
  },
  switchLink: {
    fontWeight: '700',
    color: authColors.primary,
  },
});
