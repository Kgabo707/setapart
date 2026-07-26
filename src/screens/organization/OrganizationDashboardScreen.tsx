import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, Icon, List, Text } from 'react-native-paper';

import { OrganizationAvatar } from '../../components/common/OrganizationAvatar';
import { EmptyState } from '../../components/common/StateViews';
import { StatusPill } from '../../components/common/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { OrganizationStackScreenProps } from '../../navigation/types';
import { listVideosByOrganization } from '../../services/api/videos';
import { elevation, radius, spacing, useAppTheme } from '../../theme';
import { formatViewCount } from '../../utils/format';

/**
 * Entry point to the organization context. Deliberately thin for now — the full
 * dashboard (analytics, moderation queue, member management) is a follow-up.
 */
export const OrganizationDashboardScreen = ({
  navigation,
}: OrganizationStackScreenProps<'Dashboard'>) => {
  const theme = useAppTheme();
  const { user, organization } = useAuth();

  const orgId = organization?.id ?? user?.orgId;

  const loadVideos = useCallback(
    async () => (orgId ? listVideosByOrganization(orgId, 50) : []),
    [orgId],
  );
  const { data } = useAsyncData(loadVideos);

  if (!organization) {
    return (
      <EmptyState
        icon="domain-off"
        title="No organization linked"
        description="Your account has the organization role but no organization record. Contact support so we can reconnect them."
        actionLabel="Back"
        onActionPress={navigation.goBack}
      />
    );
  }

  const published = data ?? [];
  const totalViews = published.reduce((sum, video) => sum + video.viewCount, 0);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card
          mode="contained"
          style={[styles.hero, { backgroundColor: theme.brand.navy }, elevation.level2]}
        >
          <View style={styles.heroInner}>
            <OrganizationAvatar
              name={organization.name}
              logoUrl={organization.logoUrl}
              size={52}
              verified={organization.verificationStatus === 'verified'}
            />
            <View style={styles.heroText}>
              <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.brand.onNavy }}>
                {organization.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.brand.onNavyMuted }}>
                {organization.contactEmail}
              </Text>
            </View>
            <StatusPill
              label={organization.verificationStatus}
              tone={organization.verificationStatus === 'verified' ? 'success' : 'warning'}
              onNavy
            />
          </View>
        </Card>

        <View style={styles.metrics}>
          <Metric icon="play-circle-outline" value={String(published.length)} label="Published" />
          <Metric icon="eye-outline" value={formatViewCount(totalViews)} label="Total views" />
          <Metric
            icon="account-heart-outline"
            value={formatViewCount(organization.followerCount)}
            label="Followers"
          />
        </View>

        <Card
          mode="elevated"
          elevation={1}
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
        >
          <List.Section>
            <List.Item
              title="Your content"
              description="Published, pending review and rejected uploads"
              left={(props) => (
                <List.Icon {...props} icon="video-outline" color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('ManageVideos')}
            />
            <List.Item
              title="Upload a video"
              description="Send a new asset to Mux and submit it for review"
              left={(props) => (
                <List.Icon {...props} icon="upload-outline" color={theme.brand.accent} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('UploadVideo')}
            />
            <List.Item
              title="Organization settings"
              description="Name, description, logo and contact details"
              left={(props) => (
                <List.Icon {...props} icon="cog-outline" color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('OrganizationSettings')}
            />
          </List.Section>
        </Card>

        <Text variant="bodySmall" style={[styles.note, { color: theme.colors.outline }]}>
          You are in the organization context. Your viewer tabs are still running underneath —
          use back to return to exactly where you were.
        </Text>
      </ScrollView>

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

const Metric = ({ icon, value, label }: { icon: string; value: string; label: string }) => {
  const theme = useAppTheme();
  return (
    <Card
      mode="elevated"
      elevation={1}
      style={[styles.metric, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.metricInner}>
        <Icon source={icon} size={20} color={theme.colors.primary} />
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
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
  root: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  hero: { borderRadius: radius.lg },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  heroText: { flex: 1 },
  metrics: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  metric: { flex: 1, borderRadius: radius.md },
  metricInner: { alignItems: 'center', paddingVertical: spacing.md, gap: 2 },
  card: { borderRadius: radius.lg, marginTop: spacing.lg },
  note: { marginTop: spacing.lg, textAlign: 'center' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.xl, borderRadius: radius.lg },
});
