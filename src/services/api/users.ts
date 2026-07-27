import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import type { AppUser, WatchHistoryEntry } from '../../types/models';
import { demoStore, hydrateDemoState } from '../demo/demoStore';
import { COLLECTIONS, getDb, isFirebaseConfigured } from '../firebase';

const MAX_WATCH_HISTORY = 50;

const toAppUser = (id: string, data: Record<string, unknown>): AppUser => ({
  id,
  displayName: (data.displayName as string) ?? '',
  email: (data.email as string) ?? '',
  roles: (data.roles as AppUser['roles']) ?? ['viewer'],
  orgId: data.orgId as string | undefined,
  favoriteVideoIds: (data.favoriteVideoIds as string[]) ?? [],
  watchLaterVideoIds: (data.watchLaterVideoIds as string[]) ?? [],
  followedOrgIds: (data.followedOrgIds as string[]) ?? [],
  watchHistory: (data.watchHistory as WatchHistoryEntry[]) ?? [],
  photoUrl: data.photoUrl as string | undefined,
  createdAt:
    (data.createdAt as { toDate?: () => Date })?.toDate?.().toISOString() ??
    (data.createdAt as string) ??
    new Date().toISOString(),
});

export const getUserProfile = async (userId: string): Promise<AppUser | null> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.getUser(userId);
  }

  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.users, userId));
  return snapshot.exists() ? toAppUser(snapshot.id, snapshot.data()) : null;
};

/** Every account is created as a viewer; the organization role is granted later. */
export const createUserProfile = async (
  userId: string,
  { displayName, email }: { displayName: string; email: string },
): Promise<AppUser> => {
  const profile: AppUser = {
    id: userId,
    displayName,
    email,
    roles: ['viewer'],
    favoriteVideoIds: [],
    watchLaterVideoIds: [],
    followedOrgIds: [],
    watchHistory: [],
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.upsertUser(profile);
  }

  await setDoc(doc(getDb(), COLLECTIONS.users, userId), {
    displayName,
    email,
    roles: profile.roles,
    favoriteVideoIds: [],
    watchLaterVideoIds: [],
    followedOrgIds: [],
    watchHistory: [],
    createdAt: serverTimestamp(),
  });
  return profile;
};

const mutateDemoUser = async (userId: string, mutate: (user: AppUser) => AppUser) => {
  await hydrateDemoState();
  const current = demoStore.getUser(userId);
  if (current) demoStore.upsertUser(mutate(current));
};

/**
 * Promotes a user to organization owner. Called only from the moderation approval
 * flow (`services/api/organizations.ts#approveOrganization`) — never by the applicant
 * themselves, which is what keeps `submitOrganizationApplication` from touching roles.
 */
export const grantOrganizationRole = async (userId: string, orgId: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    await mutateDemoUser(userId, (user) => ({
      ...user,
      roles: user.roles.includes('organization') ? user.roles : [...user.roles, 'organization'],
      orgId,
    }));
    return;
  }

  await updateDoc(doc(getDb(), COLLECTIONS.users, userId), {
    roles: arrayUnion('organization'),
    orgId,
  });
};

export const setVideoFavorite = async (
  userId: string,
  videoId: string,
  favorite: boolean,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    await mutateDemoUser(userId, (user) => ({
      ...user,
      favoriteVideoIds: favorite
        ? Array.from(new Set([videoId, ...user.favoriteVideoIds]))
        : user.favoriteVideoIds.filter((id) => id !== videoId),
    }));
    return;
  }

  await updateDoc(doc(getDb(), COLLECTIONS.users, userId), {
    favoriteVideoIds: favorite ? arrayUnion(videoId) : arrayRemove(videoId),
  });
};

export const setVideoSaved = async (
  userId: string,
  videoId: string,
  saved: boolean,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    await mutateDemoUser(userId, (user) => ({
      ...user,
      watchLaterVideoIds: saved
        ? Array.from(new Set([videoId, ...user.watchLaterVideoIds]))
        : user.watchLaterVideoIds.filter((id) => id !== videoId),
    }));
    return;
  }

  await updateDoc(doc(getDb(), COLLECTIONS.users, userId), {
    watchLaterVideoIds: saved ? arrayUnion(videoId) : arrayRemove(videoId),
  });
};

export const setOrganizationFollowed = async (
  userId: string,
  orgId: string,
  followed: boolean,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    await mutateDemoUser(userId, (user) => ({
      ...user,
      followedOrgIds: followed
        ? Array.from(new Set([orgId, ...user.followedOrgIds]))
        : user.followedOrgIds.filter((id) => id !== orgId),
    }));
    return;
  }

  await updateDoc(doc(getDb(), COLLECTIONS.users, userId), {
    followedOrgIds: followed ? arrayUnion(orgId) : arrayRemove(orgId),
  });
};

/**
 * Watch history is stored on the user document (per the data model), so it is rewritten
 * as a whole array with the newest entry first and older duplicates collapsed.
 */
export const recordWatchProgress = async (
  user: AppUser,
  videoId: string,
  positionSeconds: number,
): Promise<WatchHistoryEntry[]> => {
  const entry: WatchHistoryEntry = {
    videoId,
    watchedAt: new Date().toISOString(),
    positionSeconds: Math.max(0, Math.round(positionSeconds)),
  };

  const watchHistory = [entry, ...user.watchHistory.filter((it) => it.videoId !== videoId)].slice(
    0,
    MAX_WATCH_HISTORY,
  );

  if (!isFirebaseConfigured) {
    await mutateDemoUser(user.id, (current) => ({ ...current, watchHistory }));
    return watchHistory;
  }

  await updateDoc(doc(getDb(), COLLECTIONS.users, user.id), { watchHistory });
  return watchHistory;
};
