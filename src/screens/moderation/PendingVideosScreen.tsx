import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';

import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ModerationStackScreenProps } from '../../navigation/types';
import { listPendingVideos, setVideoPublishStatus } from '../../services/api/videos';
import { muxThumbnailUrl } from '../../services/mux';
import { radius, spacing, useAppTheme } from '../../theme';
import { CATEGORY_LABELS, type VideoWithOrg } from '../../types/models';
import { formatDuration, formatRelativeDate } from '../../utils/format';

export const PendingVideosScreen = (_: ModerationStackScreenProps<'PendingVideos'>) => {
  const loadPending = useCallback(() => listPendingVideos(200), []);
  const { data, loading, refreshing, refresh } = useAsyncData(loadPending);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const act = async (videoId: string, status: 'published' | 'rejected') => {
    setActingOn(videoId);
    try {
      await setVideoPublishStatus(videoId, status);
      await refresh();
    } finally {
      setActingOn(null);
    }
  };

  if (loading && !data) return <LoadingState label="Loading submissions…" />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={
        <EmptyState
          icon="video-outline"
          title="No videos waiting"
          description="New video submissions from organizations will show up here for review."
        />
      }
      renderItem={({ item }) => (
        <PendingVideoCard
          video={item}
          busy={actingOn === item.id}
          onApprove={() => act(item.id, 'published')}
          onReject={() => act(item.id, 'rejected')}
        />
      )}
    />
  );
};

const PendingVideoCard = ({
  video,
  busy,
  onApprove,
  onReject,
}: {
  video: VideoWithOrg;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const theme = useAppTheme();

  return (
    <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardBody}>
        <View style={styles.header}>
          <View style={[styles.thumbWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
            {video.videoAssetId ? (
              <Card.Cover
                source={{ uri: video.thumbnailUrl ?? muxThumbnailUrl(video.videoAssetId, { width: 160 }) }}
                style={styles.thumb}
              />
            ) : (
              <Icon source="video-outline" size={22} color={theme.colors.primary} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
              {video.title}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {video.organization?.name ?? 'Unknown organization'} · {CATEGORY_LABELS[video.category]}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {formatDuration(video.duration)} · Submitted {formatRelativeDate(video.createdAt)}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" numberOfLines={3} style={{ color: theme.colors.onSurfaceVariant }}>
          {video.description}
        </Text>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onReject}
            disabled={busy}
            textColor={theme.colors.error}
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
          >
            Reject
          </Button>
          <Button
            mode="contained"
            onPress={onApprove}
            loading={busy}
            disabled={busy}
            buttonColor={theme.brand.accent}
            textColor={theme.brand.onAccent}
            style={styles.actionButton}
          >
            Approve
          </Button>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.md },
  thumbWrap: {
    width: 96,
    height: 72,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: { width: 96, height: 72 },
  headerText: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { flex: 1, borderRadius: radius.pill },
});
