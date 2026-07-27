import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { VideoRail } from '../../components/video/VideoRail';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useWatchProgress } from '../../hooks/useWatchProgress';
import type { MainTabScreenProps } from '../../navigation/types';
import { listVideosByIds } from '../../services/api/videos';
import { spacing, useAppTheme } from '../../theme';
import type { VideoWithOrg } from '../../types/models';

type LibraryData = {
  liked: VideoWithOrg[];
  saved: VideoWithOrg[];
  history: VideoWithOrg[];
};

/**
 * First cut of My Library: the three shelves the player writes to. Playlists, downloads
 * and followed-organization feeds come with the My Library follow-up.
 */
export const LibraryScreen = ({ navigation }: MainTabScreenProps<'Library'>) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { progressFor } = useWatchProgress();

  const likedKey = (user?.favoriteVideoIds ?? []).join(',');
  const savedKey = (user?.watchLaterVideoIds ?? []).join(',');
  const historyKey = (user?.watchHistory ?? []).map((entry) => entry.videoId).join(',');

  const loadLibrary = useCallback(async (): Promise<LibraryData> => {
    const split = (key: string) => (key ? key.split(',') : []);
    const [liked, saved, history] = await Promise.all([
      listVideosByIds(split(likedKey)),
      listVideosByIds(split(savedKey)),
      listVideosByIds(split(historyKey)),
    ]);
    return { liked, saved, history };
  }, [historyKey, likedKey, savedKey]);

  const { data, loading, refreshing, refresh } = useAsyncData(loadLibrary);

  const isEmpty =
    !data?.liked.length && !data?.saved.length && !data?.history.length;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.brand.navy }} statusBarHeight={insets.top}>
        <Appbar.Content title="My Library" color={theme.brand.onNavy} />
      </Appbar.Header>

      {loading && !data ? (
        <LoadingState label="Loading your library…" />
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
          {isEmpty ? (
            <EmptyState
              icon="bookmark-multiple-outline"
              title="Nothing saved yet"
              description="Like or save a video and it will appear here, along with everything you have watched."
              actionLabel="Browse Home"
              onActionPress={() => navigation.navigate('Home')}
            />
          ) : null}

          <VideoRail
            title="Continue watching"
            videos={data?.history ?? []}
            progressFor={progressFor}
            onVideoPress={(video) => navigation.navigate('VideoPlayer', { videoId: video.id })}
          />
          <VideoRail
            title="Saved"
            subtitle="Your watch-later shelf"
            videos={data?.saved ?? []}
            onVideoPress={(video) => navigation.navigate('VideoPlayer', { videoId: video.id })}
          />
          <VideoRail
            title="Liked"
            videos={data?.liked ?? []}
            onVideoPress={(video) => navigation.navigate('VideoPlayer', { videoId: video.id })}
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
});
