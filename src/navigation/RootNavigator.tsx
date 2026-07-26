import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { BrandWordmark } from '../components/common/BrandWordmark';
import { useAuth } from '../context/AuthContext';
import { CategoryFeedScreen } from '../screens/category/CategoryFeedScreen';
import { OrganizationProfileScreen } from '../screens/organization/OrganizationProfileScreen';
import { RegisterOrganizationScreen } from '../screens/profile/RegisterOrganizationScreen';
import { VideoPlayerScreen } from '../screens/video/VideoPlayerScreen';
import { navigationTheme, spacing, useAppTheme } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { OrganizationNavigator } from './OrganizationNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const SplashScreen = () => {
  const theme = useAppTheme();
  return (
    <View style={[styles.splash, { backgroundColor: theme.brand.navy }]}>
      <BrandWordmark size="lg" onNavy showTagline />
      <ActivityIndicator animating color={theme.brand.accent} style={styles.spinner} />
    </View>
  );
};

export const RootNavigator = () => {
  const theme = useAppTheme();
  const { initializing, user } = useAuth();

  if (initializing) return <SplashScreen />;

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? (
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
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VideoPlayer"
            component={VideoPlayerScreen}
            options={{ headerShown: false, animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="CategoryFeed"
            component={CategoryFeedScreen}
            options={{ title: '' }}
          />
          <Stack.Screen
            name="OrganizationProfile"
            component={OrganizationProfileScreen}
            options={{ title: '' }}
          />
          <Stack.Screen
            name="RegisterOrganization"
            component={RegisterOrganizationScreen}
            options={{ title: 'Register your organization' }}
          />
          <Stack.Screen
            name="OrganizationArea"
            component={OrganizationNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinner: { marginTop: spacing.xl },
});
