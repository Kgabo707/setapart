import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '../../theme';

export type PillTone = 'accent' | 'navy' | 'neutral' | 'success' | 'warning' | 'onDark';

type StatusPillProps = {
  label: string;
  tone?: PillTone;
  /** A filled dot before the label — used for the live indicator. */
  dot?: boolean;
};

/** Compact Material-style badge for FEATURED / LIVE / verification states. */
export const StatusPill = ({ label, tone = 'neutral', dot = false }: StatusPillProps) => {
  const theme = useAppTheme();

  const tones: Record<PillTone, { background: string; foreground: string }> = {
    accent: { background: theme.brand.accent, foreground: theme.brand.onAccent },
    navy: { background: theme.brand.navy, foreground: theme.brand.onNavy },
    neutral: { background: theme.colors.surfaceVariant, foreground: theme.colors.onSurfaceVariant },
    success: { background: 'rgba(46, 125, 91, 0.12)', foreground: theme.brand.verified },
    warning: { background: 'rgba(185, 138, 46, 0.14)', foreground: theme.brand.pending },
    onDark: { background: 'rgba(255, 255, 255, 0.18)', foreground: theme.brand.onNavy },
  };

  const { background, foreground } = tones[tone];

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
