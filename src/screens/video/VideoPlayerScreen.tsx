import * as Clipboard from 'expo-clipboard';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Divider, Icon, Snackbar, Text, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganizationAvatar } from '../../components/common/OrganizationAvatar';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { StatusPill } from '../../components/common/StatusPill';
import { VideoPlayerSurface } from '../../components/video/VideoPlayerSurface';
import { VideoRail } from '../../components/video/VideoRail';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useWatchProgress } from '../../hooks/useWatchProgress';
import type { RootStackScreenProps } from '../../navigation/types';
import {
  getPublishedVideo,
  listVideosByCategory,
  listVideosByOrganization,
  recordVideoView,
} from '../../services/api/videos';
import { muxStreamUrl, muxThumbnailUrl } from '../../services/mux';
import { radius, spacing, useAppTheme } from '../../theme';
import { CATEGORY_LABELS, type VideoWithOrg } from '../../types/models';
import { formatRelativeDate, formatViews } from '../../utils/format';

const PROGRESS_SAVE_INTERVAL_MS = 10_000;

type PlayerData = {
  video: VideoWithOrg;
  related: VideoWithOrg[];
};

export const VideoPlayerScreen = ({ route, navigation }: RootStackScreenProps<'VideoPlayer'>) => {
  const { videoId } = route.params;
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const {
    user,
    isFavorite,
    isSaved,
    isFollowing,
    toggleFavorite,
    toggleSaved,
    toggleFollow,
    saveWatchProgress,
  } = useAuth();
  const { positionFor } = useWatchProgress();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const lastSavedAt = useRef(0);

  const loadVideo = useCallback(async (): Promise<PlayerData> => {
    const video = await getPublishedVideo(videoId);
    if (!video) throw new Error('This video is no longer available.');

    const [fromOrg, fromCategory] = await Promise.all([
      listVideosByOrganization(video.orgId, 8),
      listVideosByCategory(video.category, 8),
    ]);

    const related = [...fromOrg, ...fromCategory]
      .filter((candidate) => candidate.id !== video.id)
      .filter((candidate, index, all) => all.findIndex((it) => it.id === candidate.id) === index)
      .slice(0, 10);

    return { video, related };
  }, [videoId]);

  const { data, loading, error } = useAsyncData(loadVideo);

  useEffect(() => {
    if (data) void recordVideoView(data.video.id).catch(() => undefined);
  }, [data]);

  /**
   * Orientation locking isn't supported everywhere (web, some devices) — it's a
   * nice-to-have for fullscreen playback, not something that should surface as an
   * unhandled rejection when it's simply unavailable.
   */
  const lockOrientation = useCallback((orientation: ScreenOrientation.OrientationLock) => {
    return ScreenOrientation.lockAsync(orientation).catch(() => undefined);
  }, []);

  const exitFullscreen = useCallback(async () => {
    setIsFullscreen(false);
    await lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, [lockOrientation]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
      return;
    }
    setIsFullscreen(true);
    await lockOrientation(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, [exitFullscreen, isFullscreen, lockOrientation]);

  // Never strand the device in landscape when the viewer navigates away.
  useEffect(
    () => () => {
      void lockOrientation(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    },
    [lockOrientation],
  );

  const onProgress = useCallback(
    (positionSeconds: number) => {
      const now = Date.now();
      if (now - lastSavedAt.current < PROGRESS_SAVE_INTERVAL_MS) return;
      lastSavedAt.current = now;
      void saveWatchProgress(videoId, positionSeconds);
    },
    [saveWatchProgress, videoId],
  );

  const onShare = useCallback(async () => {
    if (!data) return;
    const { title, id } = data.video;
    const link = `https://setapart.app/watch/${id}`;
    try {
      await Share.share({ title, message: `${title} on SetApart — ${link}`, url: link });
    } catch {
      await Clipboard.setStringAsync(link);
      setSnackbar('Link copied to clipboard');
    }
  }, [data]);

  if (loading && !data) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <LoadingState label="Loading video…" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Video unavailable"
          description={
            error?.message ??
            'This video may have been unpublished or is still awaiting review.'
          }
          actionLabel="Go back"
          onActionPress={navigation.goBack}
        />
      </View>
    );
  }

  const { video, related } = data;
  const organization = video.organization;
  const posterUrl = video.thumbnailUrl ?? muxThumbnailUrl(video.videoAssetId, { width: 1280 });
  const liked = isFavorite(video.id);
  const saved = isSaved(video.id);
  const following = organization ? isFollowing(organization.id) : false;

  const playerHeight = isFullscreen ? height : Math.round(width * (9 / 16));

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" hidden={isFullscreen} />

      <View style={{ paddingTop: isFullscreen ? 0 : insets.top, backgroundColor: '#050F26' }}>
        <VideoPlayerSurface
          streamUrl={muxStreamUrl(video.videoAssetId)}
          posterUrl={posterUrl}
          title={video.title}
          startPositionSeconds={positionFor(video.id) ?? 0}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onBack={navigation.goBack}
          onProgress={onProgress}
          style={{ height: playerHeight, width: '100%' }}
        />
      </View>

      {isFullscreen ? null : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.pills}>
              <StatusPill label={CATEGORY_LABELS[video.category]} tone="neutral" />
              {video.isLive ? <StatusPill label="Live" tone="accent" dot /> : null}
              {video.isFeatured ? <StatusPill label="Featured" tone="accent" /> : null}
            </View>

            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {video.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatViews(video.viewCount)} · {formatRelativeDate(video.createdAt)}
              {video.speaker ? ` · ${video.speaker}` : ''}
            </Text>
          </View>

          <ActionRow
            liked={liked}
            saved={saved}
            onLike={() => {
              void toggleFavorite(video.id);
              setSnackbar(liked ? 'Removed from your likes' : 'Added to your likes');
            }}
            onSave={() => {
              void toggleSaved(video.id);
              setSnackbar(saved ? 'Removed from My Library' : 'Saved to My Library');
            }}
            onShare={onShare}
            disabled={!user}
          />

          <Divider style={{ backgroundColor: theme.brand.divider }} />

          {organization ? (
            <TouchableRipple
              onPress={() =>
                navigation.navigate('OrganizationProfile', { orgId: organization.id })
              }
              style={styles.orgRow}
            >
              <View style={styles.orgRowInner}>
                <OrganizationAvatar
                  name={organization.name}
                  logoUrl={organization.logoUrl}
                  size={46}
                  verified={organization.verificationStatus === 'verified'}
                />
                <View style={styles.orgText}>
                  <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
                    {organization.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {organization.followerCount.toLocaleString()} followers
                    {organization.location ? ` · ${organization.location}` : ''}
                  </Text>
                </View>
                <Button
                  mode={following ? 'outlined' : 'contained'}
                  compact
                  onPress={() => {
                    void toggleFollow(organization.id);
                    setSnackbar(
                      following ? `Unfollowed ${organization.name}` : `Following ${organization.name}`,
                    );
                  }}
                  buttonColor={following ? undefined : theme.brand.accent}
                  textColor={following ? theme.colors.primary : theme.brand.onAccent}
                  style={styles.followButton}
                >
                  {following ? 'Following' : 'Follow'}
                </Button>
              </View>
            </TouchableRipple>
          ) : null}

          <Divider style={{ backgroundColor: theme.brand.divider }} />

          <TouchableRipple
            onPress={() => setDescriptionExpanded((value) => !value)}
            style={styles.description}
          >
            <View>
              <Text
                variant="bodyMedium"
                numberOfLines={descriptionExpanded ? undefined : 3}
                style={{ color: theme.colors.onSurface }}
              >
                {video.description}
              </Text>
              <Text variant="labelMedium" style={{ color: theme.brand.accent, marginTop: spacing.xs }}>
                {descriptionExpanded ? 'Show less' : 'Show more'}
              </Text>
            </View>
          </TouchableRipple>

          {video.tags.length ? (
            <View style={styles.tags}>
              {video.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {related.length ? (
            <View style={styles.related}>
              <VideoRail
                title="Keep watching"
                subtitle={`More ${CATEGORY_LABELS[video.category].toLowerCase()} and content from ${
                  organization?.name ?? 'SetApart'
                }`}
                videos={related}
                onVideoPress={(next) =>
                  navigation.push('VideoPlayer', { videoId: next.id })
                }
              />
            </View>
          ) : (
            <SectionHeader title="Keep watching" subtitle="Nothing related just yet" />
          )}
        </ScrollView>
      )}

      <Snackbar
        visible={Boolean(snackbar)}
        onDismiss={() => setSnackbar(null)}
        duration={2200}
        style={{ backgroundColor: theme.brand.navy, borderRadius: radius.md }}
      >
        {snackbar ?? ''}
      </Snackbar>
    </View>
  );
};

type ActionRowProps = {
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  disabled?: boolean;
};

/** Material icon-button row: the primary viewer actions on a video. */
const ActionRow = ({ liked, saved, onLike, onSave, onShare, disabled }: ActionRowProps) => {
  const theme = useAppTheme();

  const actions = [
    {
      key: 'like',
      icon: liked ? 'heart' : 'heart-outline',
      label: liked ? 'Liked' : 'Like',
      onPress: onLike,
      active: liked,
    },
    {
      key: 'save',
      icon: saved ? 'bookmark' : 'bookmark-outline',
      label: saved ? 'Saved' : 'Save',
      onPress: onSave,
      active: saved,
    },
    { key: 'share', icon: 'share-variant-outline', label: 'Share', onPress: onShare, active: false },
  ];

  return (
    <View style={styles.actionRow}>
      {actions.map((action) => {
        const tint = action.active ? theme.brand.accent : theme.colors.primary;
        return (
          <TouchableRipple
            key={action.key}
            onPress={disabled ? undefined : action.onPress}
            disabled={disabled}
            borderless
            style={[styles.action, { backgroundColor: theme.colors.surfaceVariant }]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ selected: action.active }}
          >
            <View style={styles.actionInner}>
              <Icon source={action.icon} size={20} color={tint} />
              <Text variant="labelMedium" style={{ color: tint }}>
                {action.label}
              </Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center' },
  scroll: { paddingTop: spacing.lg },
  header: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  pills: { flexDirection: 'row', gap: spacing.sm },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  action: { flex: 1, borderRadius: radius.pill },
  actionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
  },
  orgRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  orgRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orgText: { flex: 1 },
  followButton: { borderRadius: radius.pill },
  description: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  related: { marginTop: spacing.sm },
});
