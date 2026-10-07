import { z } from 'zod';

export const ThemeColorsSchema = z.object({
  primary: z.string().min(1),
  primaryForeground: z.string().min(1),
  secondary: z.string().min(1),
  secondaryForeground: z.string().min(1),
  surface: z.string().min(1),
  surfaceForeground: z.string().min(1),
  background: z.string().min(1),
  text: z.string().min(1),
  muted: z.string().min(1),
  mutedForeground: z.string().min(1),
  border: z.string().min(1),
  accent: z.string().min(1),
  accentForeground: z.string().min(1),
  destructive: z.string().min(1),
  destructiveForeground: z.string().min(1),
});

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;

export const ThemeTypographySchema = z.object({
  fontFamily: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    mono: z.string().optional(),
  }),
  fontSize: z.record(z.string()).optional(),
  fontWeight: z.record(z.string()).optional(),
});

export type ThemeTypography = z.infer<typeof ThemeTypographySchema>;

export const ThemeSpacingSchema = z.object({
  unit: z.string().default('rem'),
  scale: z.record(z.string()).optional(),
});

export type ThemeSpacing = z.infer<typeof ThemeSpacingSchema>;

export const ThemeRadiusSchema = z.object({
  none: z.string().default('0'),
  sm: z.string().default('0.25rem'),
  md: z.string().default('0.5rem'),
  lg: z.string().default('0.75rem'),
  full: z.string().default('9999px'),
});

export type ThemeRadius = z.infer<typeof ThemeRadiusSchema>;

export const ThemeShadowsSchema = z.object({
  sm: z.string().optional(),
  md: z.string().optional(),
  lg: z.string().optional(),
});

export type ThemeShadows = z.infer<typeof ThemeShadowsSchema>;

export const ThemeSpecSchema = z.object({
  colorModes: z.enum(['light', 'light-dark']).default('light'),
  colors: ThemeColorsSchema,
  typography: ThemeTypographySchema,
  spacing: ThemeSpacingSchema.optional(),
  radius: ThemeRadiusSchema.optional(),
  shadows: ThemeShadowsSchema.optional(),
});

export type ThemeSpec = {
  colorModes: 'light' | 'light-dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing?: ThemeSpacing;
  radius?: ThemeRadius;
  shadows?: ThemeShadows;
};
