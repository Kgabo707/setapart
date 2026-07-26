import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAppTheme } from '../theme';
import { ManageVideosScreen } from '../screens/organization/ManageVideosScreen';
import { OrganizationDashboardScreen } from '../screens/organization/OrganizationDashboardScreen';
import { OrganizationSettingsScreen } from '../screens/organization/OrganizationSettingsScreen';
import { UploadVideoScreen } from '../screens/organization/UploadVideoScreen';
import type { OrganizationStackParamList } from './types';

const Stack = createNativeStackNavigator<OrganizationStackParamList>();

/**
 * The organization context, pushed onto the root stack from Profile. Keeping it as its
 * own navigator means the viewer tabs stay mounted underneath and the user returns to
 * exactly where they were when they back out.
 */
export const OrganizationNavigator = () => {
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
        component={OrganizationDashboardScreen}
        options={{ title: 'Organization' }}
      />
      <Stack.Screen
        name="ManageVideos"
        component={ManageVideosScreen}
        options={{ title: 'Your content' }}
      />
      <Stack.Screen
        name="UploadVideo"
        component={UploadVideoScreen}
        options={{ title: 'Upload video' }}
      />
      <Stack.Screen
        name="OrganizationSettings"
        component={OrganizationSettingsScreen}
        options={{ title: 'Organization settings' }}
      />
    </Stack.Navigator>
  );
};
