import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import type { VideoWithOrg } from '../../types/models';
import { SectionHeader } from '../common/SectionHeader';
import { VIDEO_CARD_WIDTH, VideoCard } from './VideoCard';

type VideoRailProps = {
  title: string;
  subtitle?: string;
  videos: VideoWithOrg[];
  onVideoPress: (video: VideoWithOrg) => void;
  onSeeAllPress?: () => void;
  progressFor?: (video: VideoWithOrg) => number | undefined;
};

/** A titled, horizontally scrolling rail of Material video cards. */
export const VideoRail = ({
  title,
  subtitle,
  videos,
  onVideoPress,
  onSeeAllPress,
  progressFor,
}: VideoRailProps) => {
  const renderItem = useCallback(
    ({ item }: { item: VideoWithOrg }) => (
      <VideoCard
        video={item}
        onPress={() => onVideoPress(item)}
        progress={progressFor?.(item)}
      />
    ),
    [onVideoPress, progressFor],
  );

  if (videos.length === 0) return null;

  return (
    <View style={styles.root}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actionLabel={onSeeAllPress ? 'See all' : undefined}
        onActionPress={onSeeAllPress}
      />
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        snapToInterval={VIDEO_CARD_WIDTH + spacing.md}
        decelerationRate="fast"
      />
    </View>
  );
};

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  root: { marginBottom: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  separator: { width: spacing.md },
});
