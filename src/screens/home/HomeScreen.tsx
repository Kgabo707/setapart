import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandWordmark } from '../../components/common/BrandWordmark';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { FeaturedCard } from '../../components/video/FeaturedCard';
import { VideoRail } from '../../components/video/VideoRail';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useWatchProgress } from '../../hooks/useWatchProgress';
import type { MainTabScreenProps } from '../../navigation/types';
import {
  listFeaturedVideos,
  listVideosByCategory,
  listVideosByIds,
} from '../../services/api/videos';
import { spacing, useAppTheme } from '../../theme';
import {
  CATEGORY_LABELS,
  CATEGORY_TAGLINES,
  VIDEO_CATEGORIES,
  type VideoCategory,
  type VideoWithOrg,
} from '../../types/models';
import { CategoryChips } from './CategoryChips';

type HomeFeed = {
  featured: VideoWithOrg[];
  continueWatching: VideoWithOrg[];
  byCategory: Record<VideoCategory, VideoWithOrg[]>;
};

const HERO_GUTTER = spacing.lg;

export const HomeScreen = ({ navigation }: MainTabScreenProps<'Home'>) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { progressFor } = useWatchProgress();

  const heroWidth = Math.min(width - HERO_GUTTER * 2, 520);
  const heroStride = heroWidth + spacing.md;

  const historyKey = user?.watchHistory
    .slice(0, 10)
    .map((entry) => entry.videoId)
    .join(',');

  const loadFeed = useCallback(async (): Promise<HomeFeed> => {
    const historyIds = historyKey ? historyKey.split(',') : [];

    const [featured, continueWatching, ...categoryResults] = await Promise.all([
      listFeaturedVideos(6),
      listVideosByIds(historyIds),
      ...VIDEO_CATEGORIES.map((category) => listVideosByCategory(category, 12)),
    ]);

    const byCategory = VIDEO_CATEGORIES.reduce(
      (accumulator, category, index) => ({ ...accumulator, [category]: categoryResults[index] }),
      {} as Record<VideoCategory, VideoWithOrg[]>,
    );

    return { featured, continueWatching, byCategory };
  }, [historyKey]);

  const { data, loading, refreshing, error, refresh } = useAsyncData(loadFeed);

  const openVideo = useCallback(
    (video: VideoWithOrg) => navigation.navigate('VideoPlayer', { videoId: video.id }),
    [navigation],
  );

  const openCategory = useCallback(
    (category: VideoCategory) => navigation.navigate('CategoryFeed', { category }),
    [navigation],
  );

  const greeting = user?.displayName?.split(' ')[0] ?? 'friend';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={[styles.appbar, { backgroundColor: theme.brand.navy }]}
        statusBarHeight={insets.top}
      >
        <View style={styles.appbarBrand}>
          <BrandWordmark size="sm" onNavy />
        </View>
        <Appbar.Action
          icon="magnify"
          color={theme.brand.onNavy}
          onPress={() => navigation.navigate('Search')}
          accessibilityLabel="Search"
        />
        <Appbar.Action
          icon="bell-outline"
          color={theme.brand.onNavy}
          onPress={() => navigation.navigate('Library')}
          accessibilityLabel="Notifications"
        />
      </Appbar.Header>

      {loading && !data ? (
        <LoadingState label="Gathering today's content…" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.greeting}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              Peace be with you, {greeting}.
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Watch what builds you up.
            </Text>
          </View>

          <CategoryChips onSelect={openCategory} />

          {error && !data ? (
            <EmptyState
              icon="cloud-off-outline"
              title="We could not load the feed"
              description={error.message}
              actionLabel="Try again"
              onActionPress={refresh}
            />
          ) : null}

          {data?.featured.length ? (
            <FeaturedCarousel
              videos={data.featured}
              width={heroWidth}
              stride={heroStride}
              onPress={openVideo}
            />
          ) : null}

          {data?.continueWatching.length ? (
            <VideoRail
              title="Continue watching"
              videos={data.continueWatching}
              onVideoPress={openVideo}
              progressFor={progressFor}
            />
          ) : null}

          {VIDEO_CATEGORIES.map((category) => (
            <VideoRail
              key={category}
              title={CATEGORY_LABELS[category]}
              subtitle={CATEGORY_TAGLINES[category]}
              videos={data?.byCategory[category] ?? []}
              onVideoPress={openVideo}
              onSeeAllPress={() => openCategory(category)}
              progressFor={progressFor}
            />
          ))}

          <Text
            variant="bodySmall"
            style={[styles.footer, { color: theme.colors.outline }]}
          >
            Every video on SetApart is published by a verified church, ministry or studio.
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

type FeaturedCarouselProps = {
  videos: VideoWithOrg[];
  width: number;
  stride: number;
  onPress: (video: VideoWithOrg) => void;
};

const FeaturedCarousel = ({ videos, width, stride, onPress }: FeaturedCarouselProps) => {
  const theme = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndex = useRef(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / stride);
      if (index !== lastIndex.current) {
        lastIndex.current = index;
        setActiveIndex(index);
      }
    },
    [stride],
  );

  return (
    <View style={styles.carousel}>
      <SectionHeader title="Featured this week" subtitle="Hand-picked by the SetApart team" />

      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FeaturedCard video={item} width={width} onPress={() => onPress(item)} />
        )}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={stride}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.carouselList}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
      />

      <View style={styles.dots}>
        {videos.map((video, index) => (
          <View
            key={video.id}
            style={[
              styles.dot,
              index === activeIndex
                ? { backgroundColor: theme.brand.accent, width: 18 }
                : { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: { elevation: 0 },
  appbarBrand: { flex: 1, paddingLeft: spacing.lg },
  scroll: { paddingBottom: spacing.xxl },
  greeting: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xxs,
  },
  carousel: { marginBottom: spacing.xl },
  carouselList: { paddingHorizontal: HERO_GUTTER },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: { height: 6, width: 6, borderRadius: 3 },
  footer: {
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
  },
});
