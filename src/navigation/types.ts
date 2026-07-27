import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { VideoCategory } from '../types/models';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

/** The default viewer experience — every account lands here, org owners included. */
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

/**
 * The organization context. Reached only from Profile, and only when `organization`
 * is present in the signed-in user's roles — it is an additional stack, never a
 * replacement for the viewer tabs.
 */
export type OrganizationStackParamList = {
  Dashboard: undefined;
  ManageVideos: undefined;
  UploadVideo: undefined;
  OrganizationSettings: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  VideoPlayer: { videoId: string };
  CategoryFeed: { category: VideoCategory };
  OrganizationProfile: { orgId: string };
  RegisterOrganization: undefined;
  OrganizationArea: NavigatorScreenParams<OrganizationStackParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type OrganizationStackScreenProps<T extends keyof OrganizationStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OrganizationStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

/** Gives `useNavigation()` and `navigation.navigate()` app-wide type safety. */
declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
