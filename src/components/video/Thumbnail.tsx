import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '../../theme';
import { formatDuration } from '../../utils/format';
import { StatusPill } from '../common/StatusPill';

type ThumbnailProps = {
  uri?: string;
  durationSeconds?: number;
  isLive?: boolean;
  /** 0–1 resume position, drawn as a crimson progress bar along the bottom edge. */
  progress?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export const Thumbnail = ({
  uri,
  durationSeconds,
  isLive,
  progress,
  borderRadius = radius.md,
  style,
}: ThumbnailProps) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.root, { borderRadius, backgroundColor: theme.brand.skeleton }, style]}>
      <Image
        source={uri ? { uri } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={220}
        cachePolicy="memory-disk"
      />

      {isLive ? (
        <View style={styles.topLeft}>
          <StatusPill label="Live" tone="accent" dot />
        </View>
      ) : null}

      {typeof durationSeconds === 'number' && !isLive ? (
        <View style={[styles.duration, { backgroundColor: theme.brand.scrimStrong }]}>
          <Text variant="labelSmall" style={{ color: theme.brand.onNavy }}>
            {formatDuration(durationSeconds)}
          </Text>
        </View>
      ) : null}

      {typeof progress === 'number' && progress > 0 ? (
        <View style={[styles.progressTrack, { backgroundColor: theme.brand.scrimSoft }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                backgroundColor: theme.brand.accent,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden', aspectRatio: 16 / 9, width: '100%' },
  topLeft: { position: 'absolute', top: spacing.sm, left: spacing.sm },
  duration: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.sm - 2,
  },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 },
  progressFill: { height: '100%' },
});
