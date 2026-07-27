import React from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '../../theme';
import type { VideoWithOrg } from '../../types/models';
import { formatRelativeDate, formatViews } from '../../utils/format';
import { OrganizationAvatar } from '../common/OrganizationAvatar';
import { Thumbnail } from './Thumbnail';

export const VIDEO_CARD_WIDTH = 252;

type VideoCardProps = {
  video: VideoWithOrg;
  onPress: () => void;
  /** Fixed rail width by default; pass `'100%'` for full-width vertical feeds. */
  width?: DimensionValue;
  /** 0–1 resume position from watch history. */
  progress?: number;
};

/** Material card used across every horizontal category rail on Home. */
export const VideoCard = ({
  video,
  onPress,
  width = VIDEO_CARD_WIDTH,
  progress,
}: VideoCardProps) => {
  const theme = useAppTheme();
  const organizationName = video.organization?.name ?? 'SetApart';

  return (
    <Card
      mode="elevated"
      elevation={1}
      onPress={onPress}
      style={[styles.card, { width, backgroundColor: theme.colors.surface }]}
      accessibilityLabel={`${video.title}, by ${organizationName}`}
    >
      <Thumbnail
        uri={video.thumbnailUrl}
        durationSeconds={video.duration}
        isLive={video.isLive}
        progress={progress}
        borderRadius={0}
      />

      <View style={styles.body}>
        <Text
          variant="titleSmall"
          numberOfLines={2}
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {video.title}
        </Text>

        <View style={styles.meta}>
          <OrganizationAvatar
            name={organizationName}
            logoUrl={video.organization?.logoUrl}
            size={22}
          />
          <View style={styles.metaText}>
            <Text
              variant="labelMedium"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {organizationName}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.outline }}>
              {formatViews(video.viewCount)} · {formatRelativeDate(video.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  body: { padding: spacing.md, gap: spacing.sm },
  title: { minHeight: 44 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { flex: 1 },
});
