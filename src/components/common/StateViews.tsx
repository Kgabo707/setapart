import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';

import { spacing, useAppTheme } from '../../theme';

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator animating color={theme.colors.primary} />
      <Text variant="bodyMedium" style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
  );
};

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const EmptyState = ({
  icon = 'video-off-outline',
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) => {
  const theme = useAppTheme();

  return (
    <View style={styles.center}>
      <View style={[styles.iconWell, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Icon source={icon} size={30} color={theme.colors.primary} />
      </View>
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {description ? (
        <Text
          variant="bodyMedium"
          style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <Button mode="contained" onPress={onActionPress} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { textAlign: 'center' },
  caption: { textAlign: 'center' },
  action: { marginTop: spacing.md },
});
