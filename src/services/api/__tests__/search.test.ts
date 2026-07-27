import { searchVerifiedOrganizations } from '../organizations';
import { searchPublishedVideos } from '../videos';

/**
 * Search sits on top of the same visibility guarantees as the rest of the API: a
 * pending organization or an unpublished video must never surface here just because
 * its title happens to match.
 */
describe('searchPublishedVideos', () => {
  it('returns an empty array for a blank query', async () => {
    await expect(searchPublishedVideos('   ', 10)).resolves.toEqual([]);
  });

  it('matches on title, tags and speaker, case-insensitively', async () => {
    const byTitle = await searchPublishedVideos('god who sees', 10);
    expect(byTitle.some((video) => video.id === 'vid-001')).toBe(true);

    const byTag = await searchPublishedVideos('GENESIS', 10);
    expect(byTag.some((video) => video.id === 'vid-001')).toBe(true);

    const bySpeaker = await searchPublishedVideos('daniel okoye', 10);
    expect(bySpeaker.some((video) => video.id === 'vid-001')).toBe(true);
  });

  it('never returns a pending or rejected video even if its text matches', async () => {
    const results = await searchPublishedVideos('a', 200);
    expect(results.every((video) => video.publishStatus === 'published')).toBe(true);
  });

  it('joins the publishing organization onto each result', async () => {
    const [video] = await searchPublishedVideos('god who sees', 1);
    expect(video.organization?.name).toBe('Grace Chapel');
  });
});

describe('searchVerifiedOrganizations', () => {
  it('returns an empty array for a blank query', async () => {
    await expect(searchVerifiedOrganizations('   ', 10)).resolves.toEqual([]);
  });

  it('matches a verified organization by name', async () => {
    const results = await searchVerifiedOrganizations('grace', 10);
    expect(results.some((org) => org.name === 'Grace Chapel')).toBe(true);
  });

  it('never returns an organization that is not verified', async () => {
    const results = await searchVerifiedOrganizations('still waters', 10);
    expect(results.some((org) => org.name === 'Still Waters Devotionals')).toBe(false);
  });
});
