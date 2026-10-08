import type { SettingsSpec, ThemeSpec } from '@webforge/spec';

/**
 * Minimal deterministic default settings for a valid AppSpec.
 */
export const defaultSettings: SettingsSpec = {
  locale: 'en-US',
  timezone: 'UTC',
  currency: 'USD',
};

/**
 * Minimal deterministic theme specification satisfying structural AppSpec constraints.
 */
export const defaultTheme: ThemeSpec = {
  colorModes: 'light',
  colors: {
    primary: '#000000',
    primaryForeground: '#ffffff',
    secondary: '#f0f0f0',
    secondaryForeground: '#000000',
    surface: '#ffffff',
    surfaceForeground: '#000000',
    background: '#ffffff',
    text: '#000000',
    muted: '#888888',
    mutedForeground: '#aaaaaa',
    border: '#cccccc',
    accent: '#0066cc',
    accentForeground: '#ffffff',
    destructive: '#ff0000',
    destructiveForeground: '#ffffff',
  },
  typography: {
    fontFamily: {
      heading: 'Inter',
      body: 'Inter',
    },
  },
};
