import React, { useCallback, useLayoutEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { VideoCard } from '../../components/video/VideoCard';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useWatchProgress } from '../../hooks/useWatchProgress';
import type { RootStackScreenProps } from '../../navigation/types';
import { listVideosByCategory } from '../../services/api/videos';
import { spacing, useAppTheme } from '../../theme';
import { CATEGORY_LABELS, CATEGORY_TAGLINES, type VideoWithOrg } from '../../types/models';

export const CategoryFeedScreen = ({
  route,
  navigation,
}: RootStackScreenProps<'CategoryFeed'>) => {
  const { category } = route.params;
  const theme = useAppTheme();
  const { progressFor } = useWatchProgress();

  useLayoutEffect(() => {
    navigation.setOptions({ title: CATEGORY_LABELS[category] });
  }, [category, navigation]);

  const loadCategory = useCallback(() => listVideosByCategory(category, 50), [category]);
  const { data, loading, refreshing, refresh } = useAsyncData(loadCategory);

  const renderItem = useCallback(
    ({ item }: { item: VideoWithOrg }) => (
      <VideoCard
        video={item}
        width="100%"
        progress={progressFor(item)}
        onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
      />
    ),
    [navigation, progressFor],
  );

  if (loading && !data) return <LoadingState label={`Loading ${CATEGORY_LABELS[category]}…`} />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshing={refreshing}
      onRefresh={refresh}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <Text variant="bodyMedium" style={[styles.intro, { color: theme.colors.onSurfaceVariant }]}>
          {CATEGORY_TAGLINES[category]}
        </Text>
      }
      ListEmptyComponent={
        <EmptyState
          title={`No ${CATEGORY_LABELS[category].toLowerCase()} yet`}
          description="Published content from verified organizations will show up here."
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  separator: { height: spacing.lg },
  intro: { marginBottom: spacing.lg },
});
