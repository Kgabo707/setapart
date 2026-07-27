import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { spacing, useAppTheme } from '../../theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) => {
  const theme = useAppTheme();

  return (
    <View style={styles.root}>
      <View style={styles.text}>
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="bodySmall"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <Button
          mode="text"
          compact
          onPress={onActionPress}
          textColor={theme.brand.accent}
          contentStyle={styles.actionContent}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  text: { flex: 1 },
  subtitle: { marginTop: spacing.xxs },
  actionContent: { flexDirection: 'row-reverse' },
});
