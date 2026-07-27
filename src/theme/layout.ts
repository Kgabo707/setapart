import { Platform, type ViewStyle } from 'react-native';

import { palette } from './palette';

/** 4pt base grid, as per Material Design 3 spacing guidance. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Soft, warm-tinted elevation. Material's default shadow is a cold neutral; tinting
 * it navy keeps the surfaces feeling part of the same palette.
 */
const shadow = (
  offsetY: number,
  blur: number,
  opacity: number,
  androidElevation: number,
): ViewStyle =>
  Platform.select<ViewStyle>({
    android: { elevation: androidElevation },
    default: {
      shadowColor: palette.navy900,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
  }) as ViewStyle;

export const elevation = {
  /** Resting cards in a scrolling list. */
  level1: shadow(2, 6, 0.08, 2),
  /** Featured / hero surfaces. */
  level2: shadow(4, 12, 0.12, 4),
  /** Floating elements: FAB, bottom sheets, snackbars. */
  level3: shadow(8, 20, 0.16, 8),
} as const;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
