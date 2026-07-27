import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppUser, Organization, Video } from '../../types/models';
import { DEMO_ORGANIZATIONS, DEMO_USER, DEMO_VIDEOS } from './demoContent';

const STORAGE_KEY = 'setapart.demo.state.v1';

type DemoState = {
  users: Record<string, AppUser>;
  organizations: Organization[];
  videos: Video[];
  signedInUserId: string | null;
};

const initialState = (): DemoState => ({
  users: { [DEMO_USER.id]: DEMO_USER },
  organizations: [...DEMO_ORGANIZATIONS],
  videos: [...DEMO_VIDEOS],
  signedInUserId: null,
});

let state: DemoState = initialState();
let hydrated: Promise<void> | null = null;

const persist = () => {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
    // Demo mode is best-effort; a failed write just means state resets on reload.
  });
};

export const hydrateDemoState = (): Promise<void> => {
  if (!hydrated) {
    hydrated = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<DemoState>;
        state = { ...initialState(), ...saved };
      })
      .catch(() => undefined);
  }
  return hydrated;
};

export const demoStore = {
  getState: () => state,

  getUser: (id: string) => state.users[id] ?? null,

  findUserByEmail: (email: string) =>
    Object.values(state.users).find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
    ) ?? null,

  upsertUser: (user: AppUser) => {
    state.users = { ...state.users, [user.id]: user };
    persist();
    return user;
  },

  setSignedInUser: (id: string | null) => {
    state.signedInUserId = id;
    persist();
  },

  getOrganizations: () => state.organizations,

  addOrganization: (organization: Organization) => {
    state.organizations = [...state.organizations, organization];
    persist();
    return organization;
  },

  updateOrganization: (id: string, patch: Partial<Organization>) => {
    state.organizations = state.organizations.map((org) =>
      org.id === id ? { ...org, ...patch } : org,
    );
    persist();
    return state.organizations.find((org) => org.id === id) ?? null;
  },

  getVideos: () => state.videos,

  addVideo: (video: Video) => {
    state.videos = [...state.videos, video];
    persist();
    return video;
  },

  updateVideo: (id: string, patch: Partial<Video>) => {
    state.videos = state.videos.map((video) =>
      video.id === id ? { ...video, ...patch } : video,
    );
    persist();
    return state.videos.find((video) => video.id === id) ?? null;
  },

  reset: () => {
    state = initialState();
    persist();
  },
};

export const DEMO_PASSWORD_HINT = 'any password (6+ characters)';
