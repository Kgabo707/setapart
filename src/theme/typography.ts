import { Platform } from 'react-native';
import { configureFonts } from 'react-native-paper';
import type { MD3Type, MD3TypescaleKey } from 'react-native-paper/lib/typescript/types';

const regular = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

const medium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
}) as string;

const variant = (
  fontSize: number,
  lineHeight: number,
  fontWeight: MD3Type['fontWeight'] = '400',
  letterSpacing = 0,
): MD3Type => ({
  fontFamily: fontWeight === '400' ? regular : medium,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
});

/**
 * Line heights run taller than the MD3 defaults — sermon and devotional copy is
 * long-form and needs room to breathe.
 */
const config: Partial<Record<MD3TypescaleKey, MD3Type>> = {
  displayLarge: variant(56, 66, '700', -0.5),
  displayMedium: variant(44, 54, '700', -0.25),
  displaySmall: variant(34, 44, '700'),

  headlineLarge: variant(30, 40, '700', -0.25),
  headlineMedium: variant(26, 34, '700'),
  headlineSmall: variant(22, 30, '700'),

  titleLarge: variant(20, 28, '600'),
  titleMedium: variant(17, 24, '600', 0.1),
  titleSmall: variant(15, 22, '600', 0.1),

  bodyLarge: variant(16, 26, '400', 0.15),
  bodyMedium: variant(15, 24, '400', 0.2),
  bodySmall: variant(13, 20, '400', 0.2),

  labelLarge: variant(15, 22, '600', 0.1),
  labelMedium: variant(13, 18, '600', 0.4),
  labelSmall: variant(11, 16, '600', 0.6),
};

export const fonts = configureFonts({ config });
