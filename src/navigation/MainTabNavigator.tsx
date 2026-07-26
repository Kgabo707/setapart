import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useAppTheme } from '../theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconConfig = { active: string; inactive: string };

const ICONS: Record<keyof MainTabParamList, TabIconConfig> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Search: { active: 'magnify', inactive: 'magnify' },
  Library: { active: 'bookmark-multiple', inactive: 'bookmark-multiple-outline' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

/**
 * Material-style bottom navigation. This is the default surface for *every* signed-in
 * account — holding the organization role adds a stack, it does not swap this out.
 */
export const MainTabNavigator = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.brand.accent,
        tabBarInactiveTintColor: theme.brand.onNavyMuted,
        tabBarStyle: {
          backgroundColor: theme.brand.navy,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom || spacing.sm,
          ...styles.bar,
        },
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarIcon: ({ color, focused, size }) => (
          <Icon
            source={focused ? ICONS[route.name].active : ICONS[route.name].inactive}
            size={size ?? 24}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'My Library' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  bar: {
    ...Platform.select({
      ios: {
        shadowColor: '#050F26',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  item: { paddingVertical: 2 },
});
