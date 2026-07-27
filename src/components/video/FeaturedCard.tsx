import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { elevation, radius, spacing, useAppTheme } from '../../theme';
import type { VideoWithOrg } from '../../types/models';
import { CATEGORY_LABELS } from '../../types/models';
import { formatDuration, formatViews } from '../../utils/format';
import { OrganizationAvatar } from '../common/OrganizationAvatar';
import { StatusPill } from '../common/StatusPill';

type FeaturedCardProps = {
  video: VideoWithOrg;
  width: number;
  onPress: () => void;
};

/** Hero card in the Home carousel: full-bleed artwork under a navy scrim. */
export const FeaturedCard = ({ video, width, onPress }: FeaturedCardProps) => {
  const theme = useAppTheme();
  const organizationName = video.organization?.name ?? 'SetApart';

  return (
    <View style={[styles.shadow, { width }, elevation.level2]}>
      <TouchableRipple
        onPress={onPress}
        borderless
        style={[styles.card, { backgroundColor: theme.brand.navyDeep }]}
        rippleColor="rgba(255, 255, 255, 0.16)"
        accessibilityRole="button"
        accessibilityLabel={`Featured: ${video.title}, by ${organizationName}`}
      >
        <View>
          <Image
            source={video.thumbnailUrl ? { uri: video.thumbnailUrl } : undefined}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={260}
            cachePolicy="memory-disk"
          />

          <LinearGradient
            colors={['rgba(5,15,38,0.05)', 'rgba(5,15,38,0.55)', 'rgba(5,15,38,0.94)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.content}>
            <View style={styles.badges}>
              <StatusPill
                label={video.isLive ? 'Live now' : 'Featured'}
                tone="accent"
                dot={video.isLive}
              />
              <StatusPill label={CATEGORY_LABELS[video.category]} tone="neutral" onNavy />
            </View>

            <View style={styles.spacer} />

            <Text
              variant="headlineSmall"
              numberOfLines={2}
              style={[styles.title, { color: theme.brand.onNavy }]}
            >
              {video.title}
            </Text>

            <View style={styles.metaRow}>
              <OrganizationAvatar
                name={organizationName}
                logoUrl={video.organization?.logoUrl}
                size={26}
                verified={video.organization?.verificationStatus === 'verified'}
              />
              <Text
                variant="labelMedium"
                numberOfLines={1}
                style={[styles.metaText, { color: theme.brand.onNavy }]}
              >
                {organizationName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.brand.onNavyMuted }}>
                {formatViews(video.viewCount)} · {formatDuration(video.duration)}
              </Text>
            </View>

            <View style={[styles.playCta, { backgroundColor: theme.brand.accent }]}>
              <Icon source="play" size={18} color={theme.brand.onAccent} />
              <Text variant="labelLarge" style={{ color: theme.brand.onAccent }}>
                Watch now
              </Text>
            </View>
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.lg },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  content: { height: 300, padding: spacing.lg },
  badges: { flexDirection: 'row', gap: spacing.sm },
  spacer: { flex: 1 },
  title: { marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { flexShrink: 1 },
  playCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
});
