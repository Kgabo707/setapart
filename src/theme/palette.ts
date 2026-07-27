/**
 * SetApart brand palette.
 *
 * The brand is built on deep navy + white (roughly 80% of any screen) with a warm
 * crimson reserved for accents: primary CTAs, live/featured badges and active states.
 * Deliberately avoids pure black (#000) and neon reds so the product reads as
 * modern church branding rather than cold enterprise software.
 */
export const palette = {
  navy900: '#050F26',
  navy800: '#0A1F44',
  navy700: '#132B57',
  navy600: '#1D3A6B',
  navy500: '#2B4C82',
  navy300: '#6B82AC',
  navy200: '#A9B8D2',
  navy100: '#D6DEEC',
  navy50: '#EDF1F8',

  crimson700: '#7E1717',
  crimson600: '#8E1B1B',
  crimson500: '#B22222',
  crimson400: '#C7443B',
  crimson200: '#EFC9C4',
  crimson100: '#F8E4E0',
  crimson50: '#FDF1EE',

  white: '#FFFFFF',
  offWhite: '#F8F8F6',
  warmGrey100: '#EFEEE9',
  warmGrey200: '#DEDCD5',
  warmGrey400: '#9A988F',

  /** Near-black with a navy cast — never pure #000. */
  ink: '#141A28',
  inkMuted: '#535E75',

  gold500: '#B98A2E',
  success500: '#2E7D5B',
} as const;

export type PaletteColor = (typeof palette)[keyof typeof palette];
