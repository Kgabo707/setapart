import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  Icon,
  List,
  Portal,
  Text,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrganizationAvatar } from '../../components/common/OrganizationAvatar';
import { StatusPill } from '../../components/common/StatusPill';
import { useAuth } from '../../context/AuthContext';
import type { MainTabScreenProps } from '../../navigation/types';
import { elevation, radius, spacing, useAppTheme } from '../../theme';
import { initialsOf } from '../../utils/format';

export const ProfileScreen = ({ navigation }: MainTabScreenProps<'Profile'>) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, organization, hasRole, refresh, signOut, isDemoMode } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (!user) return null;

  /**
   * The single switch that drives this screen: the `organization` role is only present
   * after a super-admin verifies the application. Until then the user sees the
   * application entry point (or its pending state), never the dashboard.
   */
  const isOrganization = hasRole('organization');
  const applicationPending = !isOrganization && organization?.verificationStatus === 'pending';
  const applicationRejected = !isOrganization && organization?.verificationStatus === 'rejected';
  const canApply = !isOrganization && !organization;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header
        style={{ backgroundColor: theme.brand.navy }}
        statusBarHeight={insets.top}
      >
        <Appbar.Content title="Profile" color={theme.brand.onNavy} />
        <Appbar.Action
          icon="cog-outline"
          color={theme.brand.onNavy}
          onPress={() => undefined}
          accessibilityLabel="Settings"
        />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={[styles.identity, { backgroundColor: theme.brand.navy }]}>
          <Avatar.Text
            size={72}
            label={initialsOf(user.displayName)}
            style={{ backgroundColor: theme.brand.accent }}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.identityText}>
            <Text variant="titleLarge" numberOfLines={1} style={{ color: theme.brand.onNavy }}>
              {user.displayName}
            </Text>
            <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.brand.onNavyMuted }}>
              {user.email}
            </Text>
            <View style={styles.roles}>
              {user.roles.map((role) => (
                <StatusPill
                  key={role}
                  label={role === 'organization' ? 'Organization' : 'Viewer'}
                  tone={role === 'organization' ? 'accent' : 'neutral'}
                  onNavy
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatTile
            icon="heart-outline"
            value={user.favoriteVideoIds.length}
            label="Liked"
            onPress={() => navigation.navigate('Library')}
          />
          <StatTile
            icon="bookmark-outline"
            value={user.watchLaterVideoIds.length}
            label="Saved"
            onPress={() => navigation.navigate('Library')}
          />
          <StatTile
            icon="account-heart-outline"
            value={user.followedOrgIds.length}
            label="Following"
            onPress={() => navigation.navigate('Library')}
          />
        </View>

        {isOrganization ? (
          <OrganizationEntryCard
            organizationName={organization?.name ?? 'Your organization'}
            logoUrl={organization?.logoUrl}
            onPress={() => navigation.navigate('OrganizationArea', { screen: 'Dashboard' })}
          />
        ) : null}

        {applicationPending ? (
          <ApplicationStatusCard
            tone="warning"
            icon="clock-outline"
            title="Application under review"
            body={`We have received the application for ${organization?.name}. A SetApart reviewer will verify your ministry and email ${organization?.contactEmail} once it is approved. Your organization tools unlock automatically.`}
          />
        ) : null}

        {applicationRejected ? (
          <ApplicationStatusCard
            tone="error"
            icon="alert-circle-outline"
            title="Application not approved"
            body={`We were not able to verify ${organization?.name}. Reply to the email we sent to ${organization?.contactEmail} and our team will take another look.`}
          />
        ) : null}

        <Card
          mode="elevated"
          elevation={1}
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
        >
          <List.Section>
            <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>
              Your content
            </List.Subheader>

            <List.Item
              title="Watch history"
              description={`${user.watchHistory.length} ${
                user.watchHistory.length === 1 ? 'video' : 'videos'
              }`}
              left={(props) => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Library')}
            />
            <List.Item
              title="Downloads"
              description="Watch offline"
              left={(props) => (
                <List.Icon {...props} icon="download-outline" color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Library')}
            />
          </List.Section>

          <Divider style={{ backgroundColor: theme.brand.divider }} />

          <List.Section>
            <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>
              For ministries
            </List.Subheader>

            {/*
              These two entries are mutually exclusive and are the only place the app
              switches context between the viewer and organization experiences.
            */}
            {isOrganization ? (
              <List.Item
                title="Organization Dashboard"
                description="Manage uploads, review status and your ministry profile"
                left={(props) => (
                  <List.Icon {...props} icon="view-dashboard-outline" color={theme.brand.accent} />
                )}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('OrganizationArea', { screen: 'Dashboard' })}
              />
            ) : null}

            {canApply ? (
              <List.Item
                title="Register your organization"
                description="Publish sermons, worship and teaching on SetApart"
                left={(props) => (
                  <List.Icon {...props} icon="domain-plus" color={theme.brand.accent} />
                )}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate('RegisterOrganization')}
              />
            ) : null}

            {applicationPending ? (
              <List.Item
                title="Your application"
                description="Awaiting verification"
                left={(props) => (
                  <List.Icon {...props} icon="clock-outline" color={theme.brand.pending} />
                )}
                onPress={() => navigation.navigate('RegisterOrganization')}
              />
            ) : null}
          </List.Section>

          <Divider style={{ backgroundColor: theme.brand.divider }} />

          <List.Section>
            <List.Subheader style={{ color: theme.colors.onSurfaceVariant }}>
              Preferences
            </List.Subheader>
            <List.Item
              title="Notifications"
              left={(props) => (
                <List.Icon {...props} icon="bell-outline" color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => undefined}
            />
            <List.Item
              title="Playback and data"
              left={(props) => (
                <List.Icon {...props} icon="play-speed" color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => undefined}
            />
            <List.Item
              title="About SetApart"
              description="Watch what builds you up."
              left={(props) => (
                <List.Icon {...props} icon="information-outline" color={theme.colors.primary} />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => undefined}
            />
          </List.Section>
        </Card>

        <Button
          mode="outlined"
          icon="logout"
          onPress={() => setSignOutVisible(true)}
          textColor={theme.colors.error}
          style={[styles.signOut, { borderColor: theme.colors.errorContainer }]}
        >
          Sign out
        </Button>

        {isDemoMode ? (
          <Text variant="bodySmall" style={[styles.demoNote, { color: theme.colors.outline }]}>
            Demo mode — content is bundled locally. Add Firebase credentials to `.env` to use a
            live project.
          </Text>
        ) : null}
      </ScrollView>

      <Portal>
        <Dialog visible={signOutVisible} onDismiss={() => setSignOutVisible(false)}>
          <Dialog.Title>Sign out?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You will need to sign back in to keep your library and watch history in sync.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSignOutVisible(false)}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                setSignOutVisible(false);
                void signOut();
              }}
            >
              Sign out
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const StatTile = ({
  icon,
  value,
  label,
  onPress,
}: {
  icon: string;
  value: number;
  label: string;
  onPress: () => void;
}) => {
  const theme = useAppTheme();
  return (
    <Card
      mode="elevated"
      elevation={1}
      onPress={onPress}
      style={[styles.statTile, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.statTileInner}>
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

const OrganizationEntryCard = ({
  organizationName,
  logoUrl,
  onPress,
}: {
  organizationName: string;
  logoUrl?: string;
  onPress: () => void;
}) => {
  const theme = useAppTheme();
  return (
    <Card
      mode="contained"
      onPress={onPress}
      style={[styles.orgCard, { backgroundColor: theme.colors.primary }, elevation.level2]}
    >
      <View style={styles.orgCardInner}>
        <OrganizationAvatar name={organizationName} logoUrl={logoUrl} size={44} verified />
        <View style={styles.orgCardText}>
          <Text variant="labelMedium" style={{ color: theme.brand.onNavyMuted }}>
            Organization account
          </Text>
          <Text variant="titleMedium" numberOfLines={1} style={{ color: theme.brand.onNavy }}>
            {organizationName}
          </Text>
        </View>
        <Icon source="arrow-right" size={22} color={theme.brand.onNavy} />
      </View>
    </Card>
  );
};

const ApplicationStatusCard = ({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'warning' | 'error';
  icon: string;
  title: string;
  body: string;
}) => {
  const theme = useAppTheme();
  const accent = tone === 'warning' ? theme.brand.pending : theme.colors.error;

  return (
    <Card
      mode="outlined"
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: accent }]}
    >
      <View style={styles.statusCardInner}>
        <Icon source={icon} size={22} color={accent} />
        <View style={styles.statusCardText}>
          <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
            {title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {body}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: spacing.xxl },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarLabel: { fontWeight: '700' },
  identityText: { flex: 1, gap: 2 },
  roles: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statTile: { flex: 1, borderRadius: radius.md },
  statTileInner: { alignItems: 'center', paddingVertical: spacing.md, gap: 2 },
  orgCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.lg },
  orgCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  orgCardText: { flex: 1 },
  card: { marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.lg },
  statusCardInner: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  statusCardText: { flex: 1, gap: spacing.xs },
  signOut: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.pill,
  },
  demoNote: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
});
