import { DEMO_VIDEOS } from '../../demo/demoContent';
import {
  getPublishedVideo,
  listAllVideosByOrganization,
  listFeaturedVideos,
  listPendingVideos,
  listTrendingVideos,
  listVideosByCategory,
  listVideosByIds,
  listVideosByOrganization,
  setVideoPublishStatus,
  submitVideoForReview,
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

/**
 * Unlike every viewer-facing query above, this one deliberately shows an organization
 * its own pending/rejected work — the guarantee here is the opposite one: the owner
 * must see every status, not just published.
 */
describe('owner-facing organization listing', () => {
  it('includes pending and rejected videos alongside published ones', async () => {
    const results = await listAllVideosByOrganization('org-grace-chapel', 50);

    expect(results.some((video) => video.publishStatus === 'published')).toBe(true);
    expect(results.some((video) => video.publishStatus === 'pending')).toBe(true);
  });

  it('only returns videos belonging to the requested organization', async () => {
    const results = await listAllVideosByOrganization('org-anchor-youth', 50);

    expect(results.every((video) => video.orgId === 'org-anchor-youth')).toBe(true);
    expect(results.some((video) => video.publishStatus === 'rejected')).toBe(true);
  });
});

describe('submitting a video for review', () => {
  it('always lands as pending, regardless of caller input', async () => {
    const created = await submitVideoForReview('org-grace-chapel', {
      title: 'Test upload',
      description: 'A video submitted through the test suite.',
      category: 'sermons',
      tags: ['test'],
      videoAssetId: 'demo-playback-id',
      duration: 600,
    });

    expect(created.publishStatus).toBe('pending');
    expect(created.viewCount).toBe(0);

    const ownerView = await listAllVideosByOrganization('org-grace-chapel', 100);
    expect(ownerView.some((video) => video.id === created.id)).toBe(true);

    const viewerView = await listVideosByOrganization('org-grace-chapel', 100);
    expect(viewerView.some((video) => video.id === created.id)).toBe(false);
  });
});

/**
 * The moderation queue and the decision that clears it — this is the one place
 * `publishStatus` is meant to change after submission.
 */
describe('moderation queue', () => {
  it('lists every pending video across all organizations', async () => {
    const pending = await listPendingVideos(200);

    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((video) => video.publishStatus === 'pending')).toBe(true);
  });

  it('approving a video makes it appear in viewer-facing queries', async () => {
    const created = await submitVideoForReview('org-grace-chapel', {
      title: 'Moderation test upload',
      description: 'A video submitted to test the approval path.',
      category: 'sermons',
      tags: [],
      videoAssetId: 'demo-playback-id',
      duration: 300,
    });

    await expect(getPublishedVideo(created.id)).resolves.toBeNull();

    await setVideoPublishStatus(created.id, 'published');

    const viewerView = await getPublishedVideo(created.id);
    expect(viewerView?.id).toBe(created.id);
  });

  it('rejecting a video keeps it out of viewer-facing queries', async () => {
    const created = await submitVideoForReview('org-grace-chapel', {
      title: 'Moderation test rejection',
      description: 'A video submitted to test the rejection path.',
      category: 'sermons',
      tags: [],
      videoAssetId: 'demo-playback-id',
      duration: 300,
    });

    await setVideoPublishStatus(created.id, 'rejected');

    await expect(getPublishedVideo(created.id)).resolves.toBeNull();
    const ownerView = await listAllVideosByOrganization('org-grace-chapel', 100);
    expect(ownerView.find((video) => video.id === created.id)?.publishStatus).toBe('rejected');
  });
});
