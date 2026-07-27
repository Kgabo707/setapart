import { demoStore } from '../../demo/demoStore';
import { getOrganizationByOwner, submitOrganizationApplication } from '../organizations';
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
