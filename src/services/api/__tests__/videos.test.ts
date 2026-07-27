import { DEMO_VIDEOS } from '../../demo/demoContent';
import {
  getPublishedVideo,
  listFeaturedVideos,
  listTrendingVideos,
  listVideosByCategory,
  listVideosByIds,
  listVideosByOrganization,
} from '../videos';

/**
 * These run against the demo data source (no Firebase credentials in the test env),
 * which is the same code path viewers hit before a project is configured. The point is
 * the visibility guarantee: nothing outside `publishStatus: "published"` may escape.
 */

const unpublished = DEMO_VIDEOS.filter((video) => video.publishStatus !== 'published');

describe('viewer-facing video queries', () => {
  it('has unpublished fixtures to guard against', () => {
    expect(unpublished.map((video) => video.publishStatus).sort()).toEqual([
      'pending',
      'rejected',
    ]);
  });

  it.each([
    ['featured', () => listFeaturedVideos(50)],
    ['trending', () => listTrendingVideos(50)],
    ['by category', () => listVideosByCategory('sermons', 50)],
    ['by organization', () => listVideosByOrganization('org-grace-chapel', 50)],
  ])('%s returns only published videos', async (_label, query) => {
    const results = await query();

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((video) => video.publishStatus === 'published')).toBe(true);
  });

  it('drops unpublished ids from a batch fetch, keeping the published ones', async () => {
    const published = DEMO_VIDEOS.find((video) => video.publishStatus === 'published')!;
    const ids = [published.id, ...unpublished.map((video) => video.id)];

    const results = await listVideosByIds(ids);

    expect(results.map((video) => video.id)).toEqual([published.id]);
  });

  it('returns null for a direct fetch of a pending video', async () => {
    const pending = DEMO_VIDEOS.find((video) => video.publishStatus === 'pending')!;

    await expect(getPublishedVideo(pending.id)).resolves.toBeNull();
  });

  it('returns null for a direct fetch of a rejected video', async () => {
    const rejected = DEMO_VIDEOS.find((video) => video.publishStatus === 'rejected')!;

    await expect(getPublishedVideo(rejected.id)).resolves.toBeNull();
  });

  it('joins the publishing organization onto each result', async () => {
    const [video] = await listVideosByOrganization('org-grace-chapel', 1);

    expect(video.organization?.name).toBe('Grace Chapel');
  });
});
