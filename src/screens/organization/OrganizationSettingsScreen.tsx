import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, List, Text } from 'react-native-paper';

import { StatusPill } from '../../components/common/StatusPill';
import { useAuth } from '../../context/AuthContext';
import type { OrganizationStackScreenProps } from '../../navigation/types';
import { radius, spacing, useAppTheme } from '../../theme';

/** Read-only for now; editing lands with the organization dashboard follow-up. */
export const OrganizationSettingsScreen = (
  _: OrganizationStackScreenProps<'OrganizationSettings'>,
) => {
  const theme = useAppTheme();
  const { organization } = useAuth();

  if (!organization) return null;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Card
        mode="elevated"
        elevation={1}
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
      >
        <List.Section>
          <List.Item title="Name" description={organization.name} />
          <List.Item title="Contact email" description={organization.contactEmail} />
          <List.Item title="Location" description={organization.location ?? 'Not set'} />
          <List.Item title="Website" description={organization.websiteUrl ?? 'Not set'} />
          <List.Item title="Description" description={organization.description} descriptionNumberOfLines={6} />
        </List.Section>

        <View style={styles.status}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Verification
          </Text>
          <StatusPill
            label={organization.verificationStatus}
            tone={organization.verificationStatus === 'verified' ? 'success' : 'warning'}
          />
        </View>
      </Card>

      <Text variant="bodySmall" style={[styles.note, { color: theme.colors.outline }]}>
        Editing these details is part of the organization dashboard follow-up.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  card: { borderRadius: radius.lg },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  note: { marginTop: spacing.lg, textAlign: 'center' },
});
