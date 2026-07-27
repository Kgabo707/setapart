import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Chip, FAB, Icon, Text } from 'react-native-paper';

import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { StatusPill } from '../../components/common/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { OrganizationStackScreenProps } from '../../navigation/types';
import { listAllVideosByOrganization } from '../../services/api/videos';
import { muxThumbnailUrl } from '../../services/mux';
import { elevation, radius, spacing, useAppTheme } from '../../theme';
import { CATEGORY_LABELS, type PublishStatus, type Video } from '../../types/models';
import { formatRelativeDate, formatViews } from '../../utils/format';

type StatusFilter = 'all' | PublishStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'pending', label: 'In review' },
  { key: 'rejected', label: 'Rejected' },
];

const TONE: Record<PublishStatus, 'success' | 'warning' | 'accent'> = {
  published: 'success',
  pending: 'warning',
  rejected: 'accent',
};

const STATUS_LABEL: Record<PublishStatus, string> = {
  published: 'Published',
  pending: 'In review',
  rejected: 'Rejected',
};

export const ManageVideosScreen = ({ navigation }: OrganizationStackScreenProps<'ManageVideos'>) => {
  const theme = useAppTheme();
  const { user, organization } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const orgId = organization?.id ?? user?.orgId;

  const loadVideos = useCallback(
    async () => (orgId ? listAllVideosByOrganization(orgId) : []),
    [orgId],
  );
  const { data, loading, refreshing, refresh } = useAsyncData(loadVideos);

  const videos = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () => (filter === 'all' ? videos : videos.filter((video) => video.publishStatus === filter)),
    [videos, filter],
  );

  const counts = useMemo(
    () => ({
      published: videos.filter((v) => v.publishStatus === 'published').length,
      pending: videos.filter((v) => v.publishStatus === 'pending').length,
      rejected: videos.filter((v) => v.publishStatus === 'rejected').length,
    }),
    [videos],
  );

  if (!orgId) {
    return (
      <EmptyState
        icon="domain-off"
        title="No organization linked"
        description="Your account has the organization role but no organization record."
      />
    );
  }

  if (loading) return <LoadingState label="Loading your content…" />;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterRow}>
        {FILTERS.map(({ key, label }) => (
          <Chip
            key={key}
            mode={filter === key ? 'flat' : 'outlined'}
            selected={filter === key}
            onPress={() => setFilter(key)}
            style={[
              styles.filterChip,
              filter === key
                ? { backgroundColor: theme.brand.navy }
                : { borderColor: theme.colors.outlineVariant },
            ]}
            textStyle={{ color: filter === key ? theme.brand.onNavy : theme.colors.primary }}
          >
            {key === 'all' ? label : `${label} (${counts[key]})`}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <VideoRow
            video={item}
            onPress={() => {
              if (item.publishStatus === 'published') {
                navigation.navigate('VideoPlayer', { videoId: item.id });
              }
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="video-outline"
            title={filter === 'all' ? 'Nothing uploaded yet' : `No ${STATUS_LABEL[filter as PublishStatus].toLowerCase()} videos`}
            description={
              filter === 'all'
                ? 'Videos you submit for review will show up here with their status.'
                : undefined
            }
          />
        }
      />

      <FAB
        icon="plus"
        label="Upload"
        color={theme.brand.onAccent}
        style={[styles.fab, { backgroundColor: theme.brand.accent }]}
        onPress={() => navigation.navigate('UploadVideo')}
      />
    </View>
  );
};

const VideoRow = ({ video, onPress }: { video: Video; onPress: () => void }) => {
  const theme = useAppTheme();
  const playable = video.publishStatus === 'published';

  return (
    <Card
      mode="elevated"
      elevation={1}
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, opacity: playable ? 1 : 0.85 },
        elevation.level1,
      ]}
      onPress={playable ? onPress : undefined}
    >
      <View style={styles.row}>
        <View style={[styles.thumbWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
          {video.thumbnailUrl || video.videoAssetId ? (
            <Card.Cover
              source={{ uri: video.thumbnailUrl ?? muxThumbnailUrl(video.videoAssetId, { width: 160 }) }}
              style={styles.thumb}
            />
          ) : (
            <Icon source="video-outline" size={22} color={theme.colors.primary} />
          )}
        </View>

        <View style={styles.rowBody}>
          <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
            {video.title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {CATEGORY_LABELS[video.category]} · {formatRelativeDate(video.createdAt)}
          </Text>
          <View style={styles.rowFooter}>
            <StatusPill label={STATUS_LABEL[video.publishStatus]} tone={TONE[video.publishStatus]} />
            {playable ? (
              <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                {formatViews(video.viewCount)}
              </Text>
            ) : null}
          </View>
        </View>

        {playable ? <Icon source="chevron-right" size={20} color={theme.colors.outline} /> : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterChip: { borderRadius: radius.pill },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl * 2, gap: spacing.md },
  card: { borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  thumbWrap: {
    width: 72,
    height: 54,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: { width: 72, height: 54 },
  rowBody: { flex: 1, gap: 2 },
  rowFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xl, borderRadius: radius.lg },
});
