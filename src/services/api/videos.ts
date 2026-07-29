import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import {
  CATEGORY_LABELS,
  type Organization,
  type PublishStatus,
  type Video,
  type VideoCategory,
  type VideoWithOrg,
} from '../../types/models';
import { omitUndefined } from '../../utils/firestore';
import { demoStore, hydrateDemoState } from '../demo/demoStore';
import { COLLECTIONS, getDb, isFirebaseConfigured } from '../firebase';
import { listOrganizationsByIds } from './organizations';

/**
 * The single source of truth for viewer-facing visibility. Every public query goes
 * through here so `pending` / `rejected` uploads cannot leak into the feed.
 */
const PUBLISHED = 'published' as const;

const toVideo = (snapshot: QueryDocumentSnapshot<DocumentData>): Video => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    orgId: data.orgId,
    title: data.title ?? '',
    description: data.description ?? '',
    category: data.category,
    tags: data.tags ?? [],
    videoAssetId: data.videoAssetId,
    thumbnailUrl: data.thumbnailUrl,
    duration: data.duration ?? 0,
    publishStatus: data.publishStatus ?? PUBLISHED,
    viewCount: data.viewCount ?? 0,
    createdAt: data.createdAt?.toDate?.().toISOString() ?? data.createdAt ?? '',
    isFeatured: data.isFeatured ?? false,
    isLive: data.isLive ?? false,
    speaker: data.speaker,
  };
};

const byNewest = (a: Video, b: Video) => b.createdAt.localeCompare(a.createdAt);

const demoPublished = async (): Promise<Video[]> => {
  await hydrateDemoState();
  return demoStore.getVideos().filter((video) => video.publishStatus === PUBLISHED);
};

/** Attaches the publishing organization to each video in a single batched read. */
export const withOrganizations = async (videos: Video[]): Promise<VideoWithOrg[]> => {
  const orgIds = Array.from(new Set(videos.map((video) => video.orgId)));
  const organizations = await listOrganizationsByIds(orgIds);
  const byId = new Map<string, Organization>(organizations.map((org) => [org.id, org]));
  return videos.map((video) => ({ ...video, organization: byId.get(video.orgId) }));
};

export const listFeaturedVideos = async (max = 6): Promise<VideoWithOrg[]> => {
  if (!isFirebaseConfigured) {
    const videos = (await demoPublished())
      .filter((video) => video.isFeatured)
      .sort(byNewest)
      .slice(0, max);
    return withOrganizations(videos);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.videos),
      where('publishStatus', '==', PUBLISHED),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );
  return withOrganizations(snapshot.docs.map(toVideo));
};

export const listVideosByCategory = async (
  category: VideoCategory,
  max = 12,
): Promise<VideoWithOrg[]> => {
  if (!isFirebaseConfigured) {
    const videos = (await demoPublished())
      .filter((video) => video.category === category)
      .sort(byNewest)
      .slice(0, max);
    return withOrganizations(videos);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.videos),
      where('publishStatus', '==', PUBLISHED),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );
  return withOrganizations(snapshot.docs.map(toVideo));
};

export const listTrendingVideos = async (max = 12): Promise<VideoWithOrg[]> => {
  if (!isFirebaseConfigured) {
    const videos = (await demoPublished())
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, max);
    return withOrganizations(videos);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.videos),
      where('publishStatus', '==', PUBLISHED),
      orderBy('viewCount', 'desc'),
      fbLimit(max),
    ),
  );
  return withOrganizations(snapshot.docs.map(toVideo));
};

export const listVideosByOrganization = async (
  orgId: string,
  max = 12,
): Promise<VideoWithOrg[]> => {
  if (!isFirebaseConfigured) {
    const videos = (await demoPublished())
      .filter((video) => video.orgId === orgId)
      .sort(byNewest)
      .slice(0, max);
    return withOrganizations(videos);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.videos),
      where('publishStatus', '==', PUBLISHED),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );
  return withOrganizations(snapshot.docs.map(toVideo));
};

/**
 * Moderation queue: every video awaiting a decision, across all organizations.
 * Moderator-only — distinct from `listAllVideosByOrganization`, which scopes to one
 * organization's own view of its own content.
 */
export const listPendingVideos = async (max = 50): Promise<VideoWithOrg[]> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    const pending = demoStore
      .getVideos()
      .filter((video) => video.publishStatus === 'pending')
      .sort(byNewest)
      .slice(0, max);
    return withOrganizations(pending);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.videos),
      where('publishStatus', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );
  return withOrganizations(snapshot.docs.map(toVideo));
};

/**
 * Owner-facing listing: unlike every other query in this file, this one deliberately
 * does NOT filter by `publishStatus` — an organization needs to see its own pending
 * and rejected uploads alongside published ones. Never use this for viewer-facing reads.
 */
export const listAllVideosByOrganization = async (orgId: string, max = 100): Promise<Video[]> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore
      .getVideos()
      .filter((video) => video.orgId === orgId)
      .sort(byNewest)
      .slice(0, max);
  }

  const snapshot = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.videos),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    ),
  );
  return snapshot.docs.map(toVideo);
};

/**
 * Submits a new video for review. Always lands as `pending` regardless of caller
 * input — publish status is only ever advanced by moderation, never by the submitter.
 */
export const submitVideoForReview = async (
  orgId: string,
  submission: {
    title: string;
    description: string;
    category: VideoCategory;
    tags: string[];
    videoAssetId: string;
    duration: number;
    speaker?: string;
    isLive?: boolean;
  },
): Promise<Video> => {
  const draft = {
    orgId,
    title: submission.title,
    description: submission.description,
    category: submission.category,
    tags: submission.tags,
    videoAssetId: submission.videoAssetId,
    duration: submission.duration,
    speaker: submission.speaker,
    isLive: submission.isLive ?? false,
    publishStatus: 'pending' as const,
    viewCount: 0,
    isFeatured: false,
  };

  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    return demoStore.addVideo({
      ...draft,
      id: `video-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  }

  const ref = await addDoc(
    collection(getDb(), COLLECTIONS.videos),
    omitUndefined({
      ...draft,
      createdAt: serverTimestamp(),
    }),
  );

  return { ...draft, id: ref.id, createdAt: new Date().toISOString() };
};

/** Moderation action — out of scope UI-wise for this build, but the write path exists. */
export const setVideoPublishStatus = async (
  videoId: string,
  publishStatus: PublishStatus,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    demoStore.updateVideo(videoId, { publishStatus });
    return;
  }
  await updateDoc(doc(getDb(), COLLECTIONS.videos, videoId), { publishStatus });
};

/**
 * Text search across published videos.
 *
 * Firestore has no native substring/full-text search, so this pulls a bounded pool of
 * recent published videos and filters client-side against title, description, tags,
 * speaker and category label. That's fine at this catalog size; past a few thousand
 * published videos this should move to a dedicated search index (Algolia, Typesense,
 * or Firestore + a text-search extension) rather than growing the pool size further.
 */
const SEARCH_POOL_SIZE = 300;

const matchesQuery = (video: Video, needle: string): boolean =>
  video.title.toLowerCase().includes(needle) ||
  video.description.toLowerCase().includes(needle) ||
  video.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
  Boolean(video.speaker?.toLowerCase().includes(needle)) ||
  CATEGORY_LABELS[video.category].toLowerCase().includes(needle);

export const searchPublishedVideos = async (
  queryText: string,
  max = 30,
): Promise<VideoWithOrg[]> => {
  const needle = queryText.trim().toLowerCase();
  if (!needle) return [];

  let pool: Video[];
  if (!isFirebaseConfigured) {
    pool = await demoPublished();
  } else {
    const snapshot = await getDocs(
      query(
        collection(getDb(), COLLECTIONS.videos),
        where('publishStatus', '==', PUBLISHED),
        orderBy('createdAt', 'desc'),
        fbLimit(SEARCH_POOL_SIZE),
      ),
    );
    pool = snapshot.docs.map(toVideo);
  }

  const matches = pool.filter((video) => matchesQuery(video, needle)).slice(0, max);
  return withOrganizations(matches);
};

export const listVideosByIds = async (ids: string[]): Promise<VideoWithOrg[]> => {
  if (ids.length === 0) return [];

  if (!isFirebaseConfigured) {
    const published = await demoPublished();
    const byId = new Map(published.map((video) => [video.id, video]));
    return withOrganizations(
      ids.map((id) => byId.get(id)).filter((video): video is Video => Boolean(video)),
    );
  }

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  const results = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(
          collection(getDb(), COLLECTIONS.videos),
          where('__name__', 'in', chunk),
          where('publishStatus', '==', PUBLISHED),
        ),
      ),
    ),
  );

  const found = new Map(results.flatMap((snap) => snap.docs.map(toVideo)).map((v) => [v.id, v]));
  return withOrganizations(
    ids.map((id) => found.get(id)).filter((video): video is Video => Boolean(video)),
  );
};

/** Returns `null` for videos that are not published, regardless of how they were linked. */
export const getPublishedVideo = async (videoId: string): Promise<VideoWithOrg | null> => {
  if (!isFirebaseConfigured) {
    const video = (await demoPublished()).find((candidate) => candidate.id === videoId);
    if (!video) return null;
    const [withOrg] = await withOrganizations([video]);
    return withOrg;
  }

  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.videos, videoId));
  if (!snapshot.exists()) return null;

  const video = toVideo(snapshot as QueryDocumentSnapshot<DocumentData>);
  if (video.publishStatus !== PUBLISHED) return null;

  const [withOrg] = await withOrganizations([video]);
  return withOrg;
};

export const recordVideoView = async (videoId: string): Promise<void> => {
  if (!isFirebaseConfigured) return;
  await updateDoc(doc(getDb(), COLLECTIONS.videos, videoId), { viewCount: increment(1) });
};
