import { demoStore } from '../../demo/demoStore';
import {
  approveOrganization,
  getOrganizationByOwner,
  listPendingOrganizations,
  rejectOrganization,
  submitOrganizationApplication,
} from '../organizations';
import { createUserProfile } from '../users';

/**
 * The rule that drives the whole navigation model: applying creates a *pending*
 * organization and must not grant the `organization` role. Only a super-admin approval
 * (simulated here by editing the records directly) does that.
 */
describe('organization applications', () => {
  beforeEach(() => {
    demoStore.reset();
  });

  it('creates a pending organization without touching the applicant roles', async () => {
    const user = await createUserProfile('user-applicant', {
      displayName: 'Ada Ministry',
      email: 'ada@example.com',
    });
    expect(user.roles).toEqual(['viewer']);

    const organization = await submitOrganizationApplication(user.id, {
      name: 'Riverside Fellowship',
      description: 'A church in the valley publishing weekly teaching.',
      contactEmail: 'media@riverside.example',
    });

    expect(organization.verificationStatus).toBe('pending');
    expect(organization.ownerUserId).toBe(user.id);

    const stored = demoStore.getUser(user.id);
    expect(stored?.roles).toEqual(['viewer']);
    expect(stored?.orgId).toBeUndefined();
  });

  it('finds an existing application so the profile can show its status', async () => {
    const user = await createUserProfile('user-reapply', {
      displayName: 'Ben',
      email: 'ben@example.com',
    });

    await expect(getOrganizationByOwner(user.id)).resolves.toBeNull();

    await submitOrganizationApplication(user.id, {
      name: 'Hillview Chapel',
      description: 'Sunday services and midweek teaching from Hillview.',
      contactEmail: 'hello@hillview.example',
    });

    const found = await getOrganizationByOwner(user.id);
    expect(found?.name).toBe('Hillview Chapel');
    expect(found?.verificationStatus).toBe('pending');
  });
});

/**
 * The moderation actions are the only place `verificationStatus` and the applicant's
 * `roles` are supposed to change together — everything else in this file is
 * deliberately careful not to touch roles.
 */
describe('moderation: approving and rejecting applications', () => {
  beforeEach(() => {
    demoStore.reset();
  });

  it('approving grants the organization role and orgId, and verifies the org', async () => {
    const user = await createUserProfile('user-to-approve', {
      displayName: 'Cee',
      email: 'cee@example.com',
    });
    const organization = await submitOrganizationApplication(user.id, {
      name: 'Lakeside Fellowship',
      description: 'A growing fellowship publishing sermons and worship nights.',
      contactEmail: 'media@lakeside.example',
    });

    expect(await listPendingOrganizations(50)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: organization.id })]),
    );

    await approveOrganization(organization.id);

    const stored = demoStore.getUser(user.id);
    expect(stored?.roles).toEqual(['viewer', 'organization']);
    expect(stored?.orgId).toBe(organization.id);

    const org = demoStore
      .getOrganizations()
      .find((candidate) => candidate.id === organization.id);
    expect(org?.verificationStatus).toBe('verified');

    expect(await listPendingOrganizations(50)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: organization.id })]),
    );
  });

  it('rejecting does not touch the applicant roles', async () => {
    const user = await createUserProfile('user-to-reject', {
      displayName: 'Dee',
      email: 'dee@example.com',
    });
    const organization = await submitOrganizationApplication(user.id, {
      name: 'Unclear Ministries',
      description: 'An application missing enough detail to verify.',
      contactEmail: 'hello@unclear.example',
    });

    await rejectOrganization(organization.id);

    const stored = demoStore.getUser(user.id);
    expect(stored?.roles).toEqual(['viewer']);
    expect(stored?.orgId).toBeUndefined();

    const org = demoStore
      .getOrganizations()
      .find((candidate) => candidate.id === organization.id);
    expect(org?.verificationStatus).toBe('rejected');
  });
});
