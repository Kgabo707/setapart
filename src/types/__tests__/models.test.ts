import { hasRole, isOrganizationOwner, type AppUser } from '../models';

const user = (overrides: Partial<AppUser> = {}): AppUser => ({
  id: 'user-1',
  displayName: 'Test Viewer',
  email: 'test@example.com',
  roles: ['viewer'],
  favoriteVideoIds: [],
  watchLaterVideoIds: [],
  followedOrgIds: [],
  watchHistory: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('role helpers', () => {
  it('treats a fresh account as a viewer only', () => {
    const fresh = user();

    expect(hasRole(fresh, 'viewer')).toBe(true);
    expect(hasRole(fresh, 'organization')).toBe(false);
    expect(isOrganizationOwner(fresh)).toBe(false);
  });

  it('keeps the viewer role alongside the organization role', () => {
    const owner = user({ roles: ['viewer', 'organization'], orgId: 'org-1' });

    expect(hasRole(owner, 'viewer')).toBe(true);
    expect(isOrganizationOwner(owner)).toBe(true);
  });

  it('does not treat an organization role without an orgId as an owner', () => {
    expect(isOrganizationOwner(user({ roles: ['viewer', 'organization'] }))).toBe(false);
  });

  it('handles a signed-out user', () => {
    expect(hasRole(null, 'viewer')).toBe(false);
    expect(isOrganizationOwner(undefined)).toBe(false);
  });
});
