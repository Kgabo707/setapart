import { useTheme } from 'react-native-paper';

import type { AppTheme } from './theme';

export { palette } from './palette';
export { spacing, radius, elevation, HIT_SLOP } from './layout';
export { appTheme, navigationTheme } from './theme';
export type { AppTheme, BrandColors } from './theme';

/** Typed accessor for the Paper theme, including SetApart's `brand` tokens. */
export const useAppTheme = () => useTheme<AppTheme>();
