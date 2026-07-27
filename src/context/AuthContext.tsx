import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import * as authApi from '../services/api/auth';
import { getOrganizationByOwner } from '../services/api/organizations';
import {
  getUserProfile,
  recordWatchProgress,
  setOrganizationFollowed,
  setVideoFavorite,
  setVideoSaved,
} from '../services/api/users';
import { isFirebaseConfigured } from '../services/firebase';
import { hasRole, type AppUser, type Organization, type UserRole } from '../types/models';

type AuthContextValue = {
  /** True until the persisted session has been resolved on cold start. */
  initializing: boolean;
  user: AppUser | null;
  /**
   * The organization application belonging to the signed-in user, at any verification
   * status. Present even while `pending`, which is how Profile knows to show
   * "under review" rather than inviting them to apply again.
   */
  organization: Organization | null;
  isDemoMode: boolean;
  hasRole: (role: UserRole) => boolean;
  isFavorite: (videoId: string) => boolean;
  isSaved: (videoId: string) => boolean;
  isFollowing: (orgId: string) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleFavorite: (videoId: string) => Promise<void>;
  toggleSaved: (videoId: string) => Promise<void>;
  toggleFollow: (orgId: string) => Promise<void>;
  saveWatchProgress: (videoId: string, positionSeconds: number) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadOrganization = useCallback(async (profile: AppUser | null) => {
    if (!profile) {
      setOrganization(null);
      return;
    }
    try {
      const org = await getOrganizationByOwner(profile.id);
      if (mounted.current) setOrganization(org);
    } catch {
      if (mounted.current) setOrganization(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authApi.observeSession((session) => {
      if (!mounted.current) return;
      setUser(session?.profile ?? null);
      setInitializing(false);
      void loadOrganization(session?.profile ?? null);
    });
    return unsubscribe;
  }, [loadOrganization]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [profile] = await Promise.all([getUserProfile(user.id), loadOrganization(user)]);
    if (mounted.current && profile) setUser(profile);
  }, [loadOrganization, user]);

  const toggleFavorite = useCallback(
    async (videoId: string) => {
      if (!user) return;
      const nextFavorite = !user.favoriteVideoIds.includes(videoId);
      // Optimistic: the action row should respond on the same frame as the tap.
      setUser((current) =>
        current
          ? {
              ...current,
              favoriteVideoIds: nextFavorite
                ? [videoId, ...current.favoriteVideoIds]
                : current.favoriteVideoIds.filter((id) => id !== videoId),
            }
          : current,
      );
      try {
        await setVideoFavorite(user.id, videoId, nextFavorite);
      } catch {
        await refresh();
      }
    },
    [refresh, user],
  );

  const toggleSaved = useCallback(
    async (videoId: string) => {
      if (!user) return;
      const nextSaved = !user.watchLaterVideoIds.includes(videoId);
      setUser((current) =>
        current
          ? {
              ...current,
              watchLaterVideoIds: nextSaved
                ? [videoId, ...current.watchLaterVideoIds]
                : current.watchLaterVideoIds.filter((id) => id !== videoId),
            }
          : current,
      );
      try {
        await setVideoSaved(user.id, videoId, nextSaved);
      } catch {
        await refresh();
      }
    },
    [refresh, user],
  );

  const toggleFollow = useCallback(
    async (orgId: string) => {
      if (!user) return;
      const nextFollowed = !user.followedOrgIds.includes(orgId);
      setUser((current) =>
        current
          ? {
              ...current,
              followedOrgIds: nextFollowed
                ? [orgId, ...current.followedOrgIds]
                : current.followedOrgIds.filter((id) => id !== orgId),
            }
          : current,
      );
      try {
        await setOrganizationFollowed(user.id, orgId, nextFollowed);
      } catch {
        await refresh();
      }
    },
    [refresh, user],
  );

  const saveWatchProgress = useCallback(
    async (videoId: string, positionSeconds: number) => {
      if (!user) return;
      try {
        const watchHistory = await recordWatchProgress(user, videoId, positionSeconds);
        if (mounted.current) {
          setUser((current) => (current ? { ...current, watchHistory } : current));
        }
      } catch {
        // Progress is a nicety — never surface a failure to the viewer.
      }
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      user,
      organization,
      isDemoMode: !isFirebaseConfigured,
      hasRole: (role) => hasRole(user, role),
      isFavorite: (videoId) => Boolean(user?.favoriteVideoIds.includes(videoId)),
      isSaved: (videoId) => Boolean(user?.watchLaterVideoIds.includes(videoId)),
      isFollowing: (orgId) => Boolean(user?.followedOrgIds.includes(orgId)),
      signIn: authApi.signIn,
      signUp: authApi.signUp,
      signOut: authApi.signOut,
      refresh,
      toggleFavorite,
      toggleSaved,
      toggleFollow,
      saveWatchProgress,
    }),
    [
      initializing,
      organization,
      refresh,
      saveWatchProgress,
      toggleFavorite,
      toggleFollow,
      toggleSaved,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>');
  return context;
};
