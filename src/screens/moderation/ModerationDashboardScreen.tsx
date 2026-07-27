import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Icon, List, Text } from 'react-native-paper';

import { LoadingState } from '../../components/common/StateViews';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ModerationStackScreenProps } from '../../navigation/types';
import { listPendingOrganizations } from '../../services/api/organizations';
import { listPendingVideos } from '../../services/api/videos';
import { elevation, radius, spacing, useAppTheme } from '../../theme';

/**
 * Entry point to the moderation context. Deliberately thin — this is the queue-count
 * overview, the actual review actions live on the two list screens it links into.
 */
export const ModerationDashboardScreen = ({
  navigation,
}: ModerationStackScreenProps<'Dashboard'>) => {
  const theme = useAppTheme();

  const loadCounts = useCallback(
    async () => Promise.all([listPendingOrganizations(200), listPendingVideos(200)]),
    [],
  );
  const { data, loading, refreshing, refresh } = useAsyncData(loadCounts);

  if (loading && !data) return <LoadingState label="Loading the review queue…" />;

  const [organizations, videos] = data ?? [[], []];

  return (
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
      <View style={styles.metrics}>
        <Metric icon="domain" value={organizations.length} label="Organizations" />
        <Metric icon="video-outline" value={videos.length} label="Videos" />
      </View>

      <Card
        mode="elevated"
        elevation={1}
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
      >
        <List.Section>
          <List.Item
            title="Organization applications"
            description={
              organizations.length === 0
                ? 'Nothing waiting on review'
                : `${organizations.length} awaiting a decision`
            }
            left={(props) => <List.Icon {...props} icon="domain" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PendingOrganizations')}
          />
          <List.Item
            title="Video submissions"
            description={
              videos.length === 0 ? 'Nothing waiting on review' : `${videos.length} awaiting a decision`
            }
            left={(props) => (
              <List.Icon {...props} icon="video-outline" color={theme.brand.accent} />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PendingVideos')}
          />
        </List.Section>
      </Card>

      <Text variant="bodySmall" style={[styles.note, { color: theme.colors.outline }]}>
        Approving or rejecting here writes immediately — there is no separate publish step.
      </Text>
    </ScrollView>
  );
};

const Metric = ({ icon, value, label }: { icon: string; value: number; label: string }) => {
  const theme = useAppTheme();
  return (
    <Card
      mode="elevated"
      elevation={1}
      style={[styles.metric, { backgroundColor: theme.colors.surface }, elevation.level1]}
    >
      <View style={styles.metricInner}>
        <Icon source={icon} size={20} color={theme.colors.primary} />
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
          {value}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, borderRadius: radius.md },
  metricInner: { alignItems: 'center', paddingVertical: spacing.md, gap: 2 },
  card: { borderRadius: radius.lg, marginTop: spacing.lg },
  note: { marginTop: spacing.lg, textAlign: 'center' },
});
