import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAppTheme } from '../theme';
import { ModerationDashboardScreen } from '../screens/moderation/ModerationDashboardScreen';
import { PendingOrganizationsScreen } from '../screens/moderation/PendingOrganizationsScreen';
import { PendingVideosScreen } from '../screens/moderation/PendingVideosScreen';
import { ReportedContentScreen } from '../screens/moderation/ReportedContentScreen';
import type { ModerationStackParamList } from './types';

const Stack = createNativeStackNavigator<ModerationStackParamList>();

/**
 * The moderation context, pushed onto the root stack from Profile — same shape as
 * OrganizationNavigator, so the viewer tabs stay mounted underneath and backing out
 * returns the moderator to exactly where they were.
 */
export const ModerationNavigator = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.brand.navy },
        headerTintColor: theme.brand.onNavy,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={ModerationDashboardScreen}
        options={{ title: 'Moderation' }}
      />
      <Stack.Screen
        name="PendingOrganizations"
        component={PendingOrganizationsScreen}
        options={{ title: 'Organization applications' }}
      />
      <Stack.Screen
        name="PendingVideos"
        component={PendingVideosScreen}
        options={{ title: 'Video submissions' }}
      />
      <Stack.Screen
        name="ReportedContent"
        component={ReportedContentScreen}
        options={{ title: 'Reported content' }}
      />
    </Stack.Navigator>
  );
};
