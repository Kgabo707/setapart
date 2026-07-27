import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { OrganizationAvatar } from '../../components/common/OrganizationAvatar';
import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ModerationStackScreenProps } from '../../navigation/types';
import { approveOrganization, listPendingOrganizations, rejectOrganization } from '../../services/api/organizations';
import { radius, spacing, useAppTheme } from '../../theme';
import type { Organization } from '../../types/models';

export const PendingOrganizationsScreen = (_: ModerationStackScreenProps<'PendingOrganizations'>) => {
  const loadPending = useCallback(() => listPendingOrganizations(200), []);
  const { data, loading, refreshing, refresh } = useAsyncData(loadPending);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const act = async (orgId: string, action: 'approve' | 'reject') => {
    setActingOn(orgId);
    try {
      if (action === 'approve') await approveOrganization(orgId);
      else await rejectOrganization(orgId);
      await refresh();
    } finally {
      setActingOn(null);
    }
  };

  if (loading && !data) return <LoadingState label="Loading applications…" />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={
        <EmptyState
          icon="domain"
          title="No applications waiting"
          description="New organization applications will show up here for review."
        />
      }
      renderItem={({ item }) => (
        <OrganizationApplicationCard
          organization={item}
          busy={actingOn === item.id}
          onApprove={() => act(item.id, 'approve')}
          onReject={() => act(item.id, 'reject')}
        />
      )}
    />
  );
};

const OrganizationApplicationCard = ({
  organization,
  busy,
  onApprove,
  onReject,
}: {
  organization: Organization;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const theme = useAppTheme();

  return (
    <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardBody}>
        <View style={styles.header}>
          <OrganizationAvatar name={organization.name} logoUrl={organization.logoUrl} size={44} />
          <View style={styles.headerText}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {organization.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {organization.contactEmail}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {organization.description}
        </Text>

        {organization.location || organization.websiteUrl ? (
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {[organization.location, organization.websiteUrl].filter(Boolean).join(' · ')}
          </Text>
        ) : null}

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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { flex: 1, borderRadius: radius.pill },
});
