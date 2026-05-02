export const Colors = {
  light: {
    primary: '#FF4D6D', // Electric Rose
    secondary: '#FF9A3C', // Amber Glow
    accent: '#6C63FF', // Violet Pulse
    background: '#FAFAFA', // Off White
    card: '#FFFFFF',
    text: '#0F0F14',
    textMuted: '#8A8A9A',
    border: '#EEEEEE',
    success: '#00C9A7',
    error: '#FF4D4D',
    tint: '#FF4D6D',
    tabIconDefault: '#8A8A9A',
    tabIconSelected: '#FF4D6D',
  },
  dark: {
    primary: '#FF4D6D',
    secondary: '#FF9A3C',
    accent: '#6C63FF',
    background: '#0F0F14', // Deep Void
    card: '#1A1A24',
    text: '#F0EEF8',
    textMuted: '#6A6A7A',
    border: '#2A2A34',
    success: '#00C9A7',
    error: '#FF4D4D',
    tint: '#FFFFFF',
    tabIconDefault: '#6A6A7A',
    tabIconSelected: '#FFFFFF',
  }
};

// Keep legacy COLORS for backward compatibility during transition if needed
export const COLORS = {
  ...Colors.dark, // Default to dark as it was the primary theme
  surface: Colors.light.background,
  surfaceDark: Colors.dark.background,
  cardLight: Colors.light.card,
  cardDark: Colors.dark.card,
  textPrimaryLight: Colors.light.text,
  textPrimaryDark: Colors.dark.text,
  textMutedLight: Colors.light.textMuted,
  textMutedDark: Colors.dark.textMuted,
  gradients: {
    warm: ['#FF4D6D', '#FF9A3C'],
    coolWarm: ['#6C63FF', '#FF4D6D'],
  }
};

export const FONTS = {
  display: 'CormorantGaramond_700Bold',
  body: 'Nunito_400Regular',
  bodyBold: 'Nunito_700Bold',
  accent: 'Pacifico_400Regular',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
};
