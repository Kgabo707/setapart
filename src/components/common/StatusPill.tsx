import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '../../theme';

export type PillTone = 'accent' | 'navy' | 'neutral' | 'success' | 'warning' | 'muted';

type StatusPillProps = {
  label: string;
  tone?: PillTone;
  /**
   * Sits on a navy surface. The muted container colours have too little contrast
   * against navy, so tones switch to a translucent-white pill with a bright label.
   */
  onNavy?: boolean;
  /** A filled dot before the label — used for the live indicator. */
  dot?: boolean;
};

/** Compact Material-style badge for FEATURED / LIVE / verification states. */
export const StatusPill = ({ label, tone = 'neutral', onNavy = false, dot = false }: StatusPillProps) => {
  const theme = useAppTheme();

  const onLight: Record<PillTone, { background: string; foreground: string }> = {
    accent: { background: theme.brand.accent, foreground: theme.brand.onAccent },
    navy: { background: theme.brand.navy, foreground: theme.brand.onNavy },
    neutral: { background: theme.colors.surfaceVariant, foreground: theme.colors.onSurfaceVariant },
    success: { background: 'rgba(46, 125, 91, 0.12)', foreground: theme.brand.verified },
    warning: { background: 'rgba(185, 138, 46, 0.14)', foreground: theme.brand.pending },
    muted: { background: theme.colors.surfaceVariant, foreground: theme.colors.outline },
  };

  const translucent = 'rgba(255, 255, 255, 0.16)';
  const onDark: Record<PillTone, { background: string; foreground: string }> = {
    accent: { background: theme.brand.accent, foreground: theme.brand.onAccent },
    navy: { background: translucent, foreground: theme.brand.onNavy },
    neutral: { background: translucent, foreground: theme.brand.onNavy },
    success: { background: 'rgba(122, 214, 175, 0.20)', foreground: '#7AD6AF' },
    warning: { background: 'rgba(240, 199, 122, 0.20)', foreground: '#F0C77A' },
    muted: { background: translucent, foreground: theme.brand.onNavyMuted },
  };

  const { background, foreground } = (onNavy ? onDark : onLight)[tone];

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: foreground }]} /> : null}
      <Text variant="labelSmall" style={[styles.label, { color: foreground }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { textTransform: 'uppercase', letterSpacing: 0.8 },
});
