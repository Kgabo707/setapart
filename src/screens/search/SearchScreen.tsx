import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, Card, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganizationAvatar } from '../../components/common/OrganizationAvatar';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { VideoCard } from '../../components/video/VideoCard';
import type { MainTabScreenProps } from '../../navigation/types';
import { searchVerifiedOrganizations } from '../../services/api/organizations';
import { searchPublishedVideos } from '../../services/api/videos';
import { radius, spacing, useAppTheme } from '../../theme';
import type { Organization, VideoWithOrg } from '../../types/models';
import { CategoryChips } from '../home/CategoryChips';

const DEBOUNCE_MS = 300;

type SearchResults = {
  videos: VideoWithOrg[];
  organizations: Organization[];
};

/**
 * Client-side substring search over published videos and verified organizations — see
 * the comment on `searchPublishedVideos` for the scaling caveat. Category shortcuts
 * stay visible until the person actually types something.
 */
export const SearchScreen = ({ navigation }: MainTabScreenProps<'Search'>) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [queryText, setQueryText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(queryText.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [queryText]);

  const onChangeText = useCallback((text: string) => {
    setQueryText(text);
    if (!text.trim()) {
      setResults(null);
      setResultsFor(null);
    }
  }, []);

  useEffect(() => {
    if (!debounced) return;

    const thisRequest = ++requestId.current;

    Promise.all([searchPublishedVideos(debounced, 30), searchVerifiedOrganizations(debounced, 10)])
      .then(([videos, organizations]) => {
        if (requestId.current !== thisRequest) return;
        setResults({ videos, organizations });
        setResultsFor(debounced);
      })
      .catch(() => {
        if (requestId.current !== thisRequest) return;
        setResults({ videos: [], organizations: [] });
        setResultsFor(debounced);
      });
  }, [debounced]);

  const isActive = queryText.trim().length > 0;
  const searching = isActive && debounced !== resultsFor;

  const openVideo = useCallback(
    (video: VideoWithOrg) => navigation.navigate('VideoPlayer', { videoId: video.id }),
    [navigation],
  );

  const openOrganization = useCallback(
    (org: Organization) => navigation.navigate('OrganizationProfile', { orgId: org.id }),
    [navigation],
  );

  const noResults =
    isActive && !searching && results && results.videos.length === 0 && results.organizations.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.brand.navy }} statusBarHeight={insets.top}>
        <Appbar.Content title="Search" color={theme.brand.onNavy} />
      </Appbar.Header>

      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Search sermons, worship, ministries"
          value={queryText}
          onChangeText={onChangeText}
          style={[styles.search, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.onSurface }}
        />
      </View>

      {!isActive ? (
        <View>
          <Text variant="titleMedium" style={[styles.heading, { color: theme.colors.onSurface }]}>
            Browse by category
          </Text>
          <CategoryChips onSelect={(category) => navigation.navigate('CategoryFeed', { category })} />
        </View>
      ) : null}

      {isActive && searching && !results ? <LoadingState label="Searching…" /> : null}

      {noResults ? (
        <EmptyState
          icon="magnify-close"
          title={`No results for "${queryText.trim()}"`}
          description="Try a different word, or browse by category instead."
        />
      ) : null}

      {isActive && results && (results.organizations.length > 0 || results.videos.length > 0) ? (
        <FlatList
          data={results.videos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            results.organizations.length > 0 ? (
              <View style={styles.orgSection}>
                <SectionHeader title="Ministries and organizations" />
                {results.organizations.map((org) => (
                  <OrganizationRow key={org.id} organization={org} onPress={() => openOrganization(org)} />
                ))}
                {results.videos.length > 0 ? (
                  <SectionHeader title="Videos" />
                ) : null}
              </View>
            ) : results.videos.length > 0 ? (
              <SectionHeader title="Videos" />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.videoRow}>
              <VideoCard video={item} width="100%" onPress={() => openVideo(item)} />
            </View>
          )}
        />
      ) : null}
    </View>
  );
};

const OrganizationRow = ({
  organization,
  onPress,
}: {
  organization: Organization;
  onPress: () => void;
}) => {
  const theme = useAppTheme();

  return (
    <Card
      mode="elevated"
      elevation={1}
      onPress={onPress}
      style={[styles.orgCard, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.orgRow}>
        <OrganizationAvatar name={organization.name} logoUrl={organization.logoUrl} size={40} verified />
        <View style={styles.orgText}>
          <Text variant="titleSmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
            {organization.name}
          </Text>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
            {organization.description}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  search: { borderRadius: radius.pill },
  heading: { paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  list: { paddingBottom: spacing.xxl },
  orgSection: { gap: spacing.sm },
  orgCard: { borderRadius: radius.lg, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  orgText: { flex: 1, gap: 2 },
  videoRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
});
