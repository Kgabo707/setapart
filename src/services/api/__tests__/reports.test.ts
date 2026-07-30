import { listOpenReports, resolveReport, submitReport } from '../reports';

/**
 * Mirrors the pattern already established for video/organization submissions: every
 * report always lands as `open` regardless of caller input, and resolving is a
 * separate, explicit moderation action.
 */
describe('submitting a report', () => {
  it('always lands as open, and is attributed to the reporter', async () => {
    const report = await submitReport({
      reporterId: 'user-reporter',
      videoId: 'vid-001',
      videoTitle: 'God Who Sees You',
      orgId: 'org-grace-chapel',
      reason: 'inappropriate',
      details: 'This does not seem right',
    });

    expect(report.status).toBe('open');
    expect(report.reporterId).toBe('user-reporter');

    const open = await listOpenReports(50);
    expect(open.some((r) => r.id === report.id)).toBe(true);
  });

  it('accepts a report with no details', async () => {
    const report = await submitReport({
      reporterId: 'user-reporter-2',
      videoId: 'vid-001',
      videoTitle: 'God Who Sees You',
      orgId: 'org-grace-chapel',
      reason: 'spam',
    });

    expect(report.status).toBe('open');
    expect(report.details).toBeUndefined();
  });
});

describe('resolving a report', () => {
  it('removes it from the open queue', async () => {
    const report = await submitReport({
      reporterId: 'user-reporter-3',
      videoId: 'vid-001',
      videoTitle: 'God Who Sees You',
      orgId: 'org-grace-chapel',
      reason: 'other',
    });

    await resolveReport(report.id);

    const open = await listOpenReports(50);
    expect(open.some((r) => r.id === report.id)).toBe(false);
  });
});
