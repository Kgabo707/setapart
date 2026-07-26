import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fbLimit,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import type { Organization, Video, VideoCategory, VideoWithOrg } from '../../types/models';
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
