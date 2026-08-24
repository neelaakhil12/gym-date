import { useGymDate } from './context/GymDateContext';

/**
 * useTheme — returns theme-aware colors based on the phone's context dark/light mode.
 * Import this in any screen component to get consistent colors across the app.
 */
export function useTheme() {
  const isDark = false;

  return {
    isDark,

    // Backgrounds
    bg:           isDark ? '#060608' : '#ffffff',
    bgSecondary:  isDark ? '#0d0e16' : '#f5f6fa',
    cardBg:       isDark ? '#12131a' : '#ffffff',
    cardBgSoft:   isDark ? 'rgba(22,23,33,0.6)' : '#ffffff',

    // Borders
    border:       isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    borderSoft:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',

    // Text
    textPrimary:  isDark ? '#ffffff' : '#111827',
    textSecond:   isDark ? '#d1d5db' : '#374151',
    textMuted:    isDark ? '#9ca3af' : '#6b7280',

    // Input
    inputBg:      isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
    inputBorder:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',

    // Section divider
    divider:      isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',

    // Header bar
    headerBg:     isDark ? 'rgba(10,11,16,0.9)' : '#ffffff',
    headerBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)',

    // Modal
    modalBg:      isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
    modalCardBg:  isDark ? '#12131a' : '#ffffff',

    // Brand
    primary:      '#e50914',
    success:      '#00c758',
    warning:      '#fac800',
  };
}
