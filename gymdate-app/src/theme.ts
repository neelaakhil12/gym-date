export const THEME = {
  COLORS: {
    primary: '#e50914', // GymDate Crimson
    primaryGlow: 'rgba(229, 9, 20, 0.25)',
    primaryBorder: 'rgba(229, 9, 20, 0.15)',
    secondary: '#fe6e00', // Amber Accent
    secondaryHover: '#ff8522',
    success: '#00c758', // Success Green
    successGlow: 'rgba(0, 199, 88, 0.15)',
    info: '#3080ff', // Info Blue
    warning: '#fac800', // Warning Yellow
    
    // Backgrounds (Dark theme specs)
    bgDark: '#060608',
    bgDarker: '#020203',
    cardDark: '#12131a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderColorActive: 'rgba(229, 9, 20, 0.3)',
    
    textPrimary: '#ffffff',
    textSecondary: '#99a1af',
    textMuted: '#6a7282',
    textBlack: '#000000',
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  RADII: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    pill: 9999,
  },
  SHADOWS: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: '#e50914',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
      elevation: 8,
    }
  }
};
