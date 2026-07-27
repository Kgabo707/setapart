import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from 'react-native-paper';

import { useAppTheme } from '../../theme';
import { initialsOf } from '../../utils/format';

type OrganizationAvatarProps = {
  name: string;
  logoUrl?: string;
  size?: number;
  verified?: boolean;
};

export const OrganizationAvatar = ({
  name,
  logoUrl,
  size = 40,
  verified = false,
}: OrganizationAvatarProps) => {
  const theme = useAppTheme();
  const badgeSize = Math.max(14, Math.round(size * 0.36));

  return (
    <View>
      {logoUrl ? (
        <Avatar.Image size={size} source={{ uri: logoUrl }} />
      ) : (
        <Avatar.Text
          size={size}
          label={initialsOf(name)}
          style={{ backgroundColor: theme.colors.primary }}
          labelStyle={{ color: theme.colors.onPrimary, fontWeight: '700' }}
        />
      )}

      {verified ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: theme.brand.verified,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Avatar.Icon
            size={badgeSize - 4}
            icon="check"
            color={theme.colors.surface}
            style={styles.badgeIcon}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeIcon: { backgroundColor: 'transparent' },
});
