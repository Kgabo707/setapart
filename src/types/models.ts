/** Roles are additive: an approved organization owner keeps `viewer` alongside it. */
export type UserRole = 'viewer' | 'organization' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type PublishStatus = 'pending' | 'published' | 'rejected';

export type VideoCategory =
  | 'sermons'
  | 'worship'
  | 'teaching'
  | 'youth'
  | 'testimonies'
  | 'films'
  | 'devotionals';

export const VIDEO_CATEGORIES: readonly VideoCategory[] = [
  'sermons',
  'worship',
  'teaching',
  'youth',
  'testimonies',
  'films',
  'devotionals',
] as const;

export const CATEGORY_LABELS: Record<VideoCategory, string> = {
  sermons: 'Sermons',
  worship: 'Worship',
  teaching: 'Teaching',
  youth: 'Youth',
  testimonies: 'Testimonies',
  films: 'Films',
  devotionals: 'Devotionals',
};

export const CATEGORY_TAGLINES: Record<VideoCategory, string> = {
  sermons: 'Preaching from verified churches and ministries',
  worship: 'Live sets, hymns and worship nights',
  teaching: 'Go deeper in the Word',
  youth: 'Made for the next generation',
  testimonies: 'Stories of what God has done',
  films: 'Feature-length faith-based storytelling',
  devotionals: 'Short encouragements for every day',
};

export const CATEGORY_ICONS: Record<VideoCategory, string> = {
  sermons: 'book-cross',
  worship: 'music-clef-treble',
  teaching: 'school-outline',
  youth: 'account-group-outline',
  testimonies: 'hand-heart-outline',
  films: 'movie-open-outline',
  devotionals: 'weather-sunset-up',
};

export type WatchHistoryEntry = {
  videoId: string;
  /** ISO-8601 timestamp of the most recent view. */
  watchedAt: string;
  /** Resume position in seconds. */
  positionSeconds: number;
};

export type AppUser = {
  id: string;
  displayName: string;
  email: string;
  roles: UserRole[];
  /** Only set once a super-admin verifies the organization application. */
  orgId?: string;
  /** Backs the "Like" action on the player. */
  favoriteVideoIds: string[];
  /**
   * Backs the "Save" action on the player and the Saved shelf in My Library. Additive
   * to the original data model so Like and Save are genuinely distinct actions rather
   * than two controls writing the same list.
   */
  watchLaterVideoIds: string[];
  followedOrgIds: string[];
  watchHistory: WatchHistoryEntry[];
  photoUrl?: string;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  verificationStatus: VerificationStatus;
  contactEmail: string;
  ownerUserId: string;
  websiteUrl?: string;
  location?: string;
  followerCount: number;
  createdAt: string;
};

export type Video = {
  id: string;
  orgId: string;
  title: string;
  description: string;
  category: VideoCategory;
  tags: string[];
  /** Mux playback identifier — see `services/mux.ts`. */
  videoAssetId: string;
  thumbnailUrl?: string;
  /** Duration in seconds. */
  duration: number;
  publishStatus: PublishStatus;
  viewCount: number;
  createdAt: string;
  /** Curated by SetApart editors; surfaces in the Home hero carousel. */
  isFeatured?: boolean;
  isLive?: boolean;
  speaker?: string;
};

/** A video joined with its (verified) publishing organization, ready for rendering. */
export type VideoWithOrg = Video & { organization?: Organization };

/** Fields an organization supplies when submitting a new video for review. */
export type VideoSubmission = {
  title: string;
  description: string;
  category: VideoCategory;
  tags: string[];
  /** Mux public playback ID — see `services/mux.ts`. Minted outside this app for now. */
  videoAssetId: string;
  /** Duration in seconds. */
  duration: number;
  speaker?: string;
  isLive?: boolean;
};

export type OrganizationApplication = {
  name: string;
  description: string;
  contactEmail: string;
  logoUrl?: string;
  websiteUrl?: string;
  location?: string;
};

export const hasRole = (user: Pick<AppUser, 'roles'> | null | undefined, role: UserRole): boolean =>
  Boolean(user?.roles?.includes(role));

export const isOrganizationOwner = (user: AppUser | null | undefined): boolean =>
  hasRole(user, 'organization') && Boolean(user?.orgId);
