import React, { useCallback, useLayoutEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { OrganizationAvatar } from '../../components/common/OrganizationAvatar';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { StatusPill } from '../../components/common/StatusPill';
import { VideoCard } from '../../components/video/VideoCard';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { RootStackScreenProps } from '../../navigation/types';
import { getOrganization } from '../../services/api/organizations';
import { listVideosByOrganization } from '../../services/api/videos';
import { radius, spacing, useAppTheme } from '../../theme';
import type { Organization, VideoWithOrg } from '../../types/models';

type OrgProfileData = { organization: Organization | null; videos: VideoWithOrg[] };

export const OrganizationProfileScreen = ({
  route,
  navigation,
}: RootStackScreenProps<'OrganizationProfile'>) => {
  const { orgId } = route.params;
  const theme = useAppTheme();
  const { isFollowing, toggleFollow } = useAuth();

  const loadProfile = useCallback(async (): Promise<OrgProfileData> => {
    const [organization, videos] = await Promise.all([
      getOrganization(orgId),
      listVideosByOrganization(orgId, 50),
    ]);
    return { organization, videos };
  }, [orgId]);

  const { data, loading, refreshing, refresh } = useAsyncData(loadProfile);

  useLayoutEffect(() => {
    navigation.setOptions({ title: data?.organization?.name ?? '' });
  }, [data?.organization?.name, navigation]);

  const renderItem = useCallback(
    ({ item }: { item: VideoWithOrg }) => (
      <VideoCard
        video={item}
        width="100%"
        onPress={() => navigation.navigate('VideoPlayer', { videoId: item.id })}
      />
    ),
    [navigation],
  );

  if (loading && !data) return <LoadingState />;

  const organization = data?.organization;
  if (!organization) {
    return (
      <EmptyState
        icon="domain-off"
        title="Organization not found"
        description="This ministry may have been removed from SetApart."
        actionLabel="Go back"
        onActionPress={navigation.goBack}
      />
    );
  }

  const following = isFollowing(organization.id);

  return (
    <FlatList
      data={data?.videos ?? []}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshing={refreshing}
      onRefresh={refresh}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <OrganizationAvatar
              name={organization.name}
              logoUrl={organization.logoUrl}
              size={64}
              verified={organization.verificationStatus === 'verified'}
            />
            <View style={styles.headerText}>
              <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                {organization.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {organization.followerCount.toLocaleString()} followers
                {organization.location ? ` · ${organization.location}` : ''}
              </Text>
              {organization.verificationStatus === 'verified' ? (
                <View style={styles.pill}>
                  <StatusPill label="Verified ministry" tone="success" />
                </View>
              ) : null}
            </View>
          </View>

          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {organization.description}
          </Text>

          <Button
            mode={following ? 'outlined' : 'contained'}
            onPress={() => void toggleFollow(organization.id)}
            buttonColor={following ? undefined : theme.brand.accent}
            textColor={following ? theme.colors.primary : theme.brand.onAccent}
            style={styles.follow}
          >
            {following ? 'Following' : 'Follow'}
          </Button>

          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            Published content
          </Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Nothing published yet"
          description="When this organization publishes a video it will appear here."
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  separator: { height: spacing.lg },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerText: { flex: 1, gap: 2 },
  pill: { marginTop: spacing.xs },
  follow: { borderRadius: radius.pill, alignSelf: 'flex-start', paddingHorizontal: spacing.lg },
});
