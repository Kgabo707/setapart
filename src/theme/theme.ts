import type { Theme as NavigationTheme } from '@react-navigation/native';
import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { palette } from './palette';
import { fonts } from './typography';

/**
 * Brand tokens that do not have a home in the MD3 colour scheme but are used across
 * the app (the navy app bar, gradient scrims over hero artwork, badge colours...).
 */
export type BrandColors = {
  navy: string;
  navyDeep: string;
  navySoft: string;
  onNavy: string;
  onNavyMuted: string;
  accent: string;
  onAccent: string;
  liveBadge: string;
  featuredBadge: string;
  verified: string;
  pending: string;
  rejected: string;
  divider: string;
  scrimStrong: string;
  scrimSoft: string;
  skeleton: string;
};

export type AppTheme = MD3Theme & { brand: BrandColors };

const brand: BrandColors = {
  navy: palette.navy800,
  navyDeep: palette.navy900,
  navySoft: palette.navy700,
  onNavy: palette.white,
  onNavyMuted: palette.navy200,
  accent: palette.crimson500,
  onAccent: palette.white,
  liveBadge: palette.crimson500,
  featuredBadge: palette.crimson500,
  verified: palette.success500,
  pending: palette.gold500,
  rejected: palette.crimson600,
  divider: palette.warmGrey200,
  scrimStrong: 'rgba(5, 15, 38, 0.78)',
  scrimSoft: 'rgba(5, 15, 38, 0.32)',
  skeleton: palette.warmGrey100,
};

export const appTheme: AppTheme = {
  ...MD3LightTheme,
  /** Paper multiplies roundness by 3 for cards, giving the 12–16px radius we want. */
  roundness: 4,
  fonts,
  brand,
  colors: {
    ...MD3LightTheme.colors,

    primary: palette.navy800,
    onPrimary: palette.white,
    primaryContainer: palette.navy50,
    onPrimaryContainer: palette.navy800,

    secondary: palette.crimson500,
    onSecondary: palette.white,
    secondaryContainer: palette.crimson100,
    onSecondaryContainer: palette.crimson700,

    tertiary: palette.navy600,
    onTertiary: palette.white,
    tertiaryContainer: palette.navy100,
    onTertiaryContainer: palette.navy700,

    error: palette.crimson600,
    onError: palette.white,
    errorContainer: palette.crimson100,
    onErrorContainer: palette.crimson700,

    background: palette.offWhite,
    onBackground: palette.ink,

    surface: palette.white,
    onSurface: palette.ink,
    surfaceVariant: palette.navy50,
    onSurfaceVariant: palette.inkMuted,
    surfaceDisabled: 'rgba(20, 26, 40, 0.12)',
    onSurfaceDisabled: 'rgba(20, 26, 40, 0.38)',

    outline: palette.warmGrey400,
    outlineVariant: palette.warmGrey200,

    inverseSurface: palette.navy800,
    inverseOnSurface: palette.white,
    inversePrimary: palette.navy200,

    shadow: palette.navy900,
    scrim: palette.navy900,
    backdrop: 'rgba(5, 15, 38, 0.4)',

    /**
     * MD3 elevation overlays. Paper tints raised surfaces with `primary`; we keep the
     * tint extremely light so cards stay white rather than turning blue-grey.
     */
    elevation: {
      level0: 'transparent',
      level1: palette.white,
      level2: '#FCFCFE',
      level3: '#FAFBFD',
      level4: '#F8FAFD',
      level5: '#F5F8FC',
    },
  },
};

export const navigationTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  dark: false,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: appTheme.colors.primary,
    background: appTheme.colors.background,
    card: appTheme.colors.surface,
    text: appTheme.colors.onSurface,
    border: brand.divider,
    notification: appTheme.colors.secondary,
  },
  fonts: NavigationDefaultTheme.fonts,
};
