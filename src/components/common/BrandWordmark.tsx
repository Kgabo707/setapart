import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { spacing, useAppTheme } from '../../theme';

type BrandWordmarkProps = {
  size?: 'sm' | 'md' | 'lg';
  onNavy?: boolean;
  showTagline?: boolean;
};

const SIZES = {
  sm: { title: 18, tagline: 11, dot: 5 },
  md: { title: 24, tagline: 12, dot: 6 },
  lg: { title: 38, tagline: 14, dot: 9 },
} as const;

/**
 * The SetApart wordmark: "Set" in the brand weight, "Apart" carrying the crimson
 * accent — the only place red appears at rest on most screens.
 */
export const BrandWordmark = ({
  size = 'md',
  onNavy = false,
  showTagline = false,
}: BrandWordmarkProps) => {
  const theme = useAppTheme();
  const { title, tagline, dot } = SIZES[size];
  const primaryColor = onNavy ? theme.brand.onNavy : theme.colors.primary;
  const taglineColor = onNavy ? theme.brand.onNavyMuted : theme.colors.onSurfaceVariant;

  return (
    <View>
      <View style={styles.row}>
        <Text
          style={[styles.title, { fontSize: title, color: primaryColor }]}
          accessibilityRole="header"
        >
          Set
          <Text style={[styles.title, { fontSize: title, color: theme.brand.accent }]}>Apart</Text>
        </Text>
        <View
          style={[
            styles.dot,
            { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: theme.brand.accent },
          ]}
        />
      </View>
      {showTagline ? (
        <Text style={[styles.tagline, { fontSize: tagline, color: taglineColor }]}>
          Watch what builds you up.
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  title: { fontWeight: '800', letterSpacing: -0.6 },
  dot: { marginLeft: 3, marginBottom: 5 },
  tagline: { marginTop: spacing.xxs, letterSpacing: 0.2 },
});
