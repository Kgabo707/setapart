import { formatDuration, formatRelativeDate, formatViews, initialsOf } from '../format';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [59, '0:59'],
    [210, '3:30'],
    [2412, '40:12'],
    [3600, '1:00:00'],
    [5280, '1:28:00'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it('clamps negative input', () => {
    expect(formatDuration(-5)).toBe('0:00');
  });
});

describe('formatViews', () => {
  it.each([
    [1, '1 view'],
    [2, '2 views'],
    [999, '999 views'],
    [1500, '1.5K views'],
    [58120, '58K views'],
    [1204881, '1.2M views'],
    [12000000, '12M views'],
  ])('formats %i as %s', (count, expected) => {
    expect(formatViews(count)).toBe(expected);
  });
});

describe('formatRelativeDate', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it.each([
    ['2026-06-01T11:59:30.000Z', 'just now'],
    ['2026-06-01T11:00:00.000Z', '1 hour ago'],
    ['2026-05-31T12:00:00.000Z', 'yesterday'],
    ['2026-05-04T12:00:00.000Z', '4 weeks ago'],
    // Future dates and the month/year auto-label branches — added when this function
    // was rewritten to stop depending on Intl.RelativeTimeFormat (not reliably
    // available in React Native's JS engine, unlike web/Node), since those are the
    // branches a missing-API crash could hide in without being exercised by a test.
    ['2026-06-01T13:00:00.000Z', 'in 1 hour'],
    ['2026-06-02T12:00:00.000Z', 'tomorrow'],
    ['2026-07-01T12:00:00.000Z', 'next month'],
    ['2026-05-01T12:00:00.000Z', 'last month'],
    ['2027-06-01T12:00:00.000Z', 'next year'],
    ['2025-06-01T12:00:00.000Z', 'last year'],
    ['2020-06-01T12:00:00.000Z', '6 years ago'],
  ])('renders %s as %s', (iso, expected) => {
    expect(formatRelativeDate(iso, now)).toBe(expected);
  });

  it('returns an empty string for an unparseable date', () => {
    expect(formatRelativeDate('not-a-date', now)).toBe('');
  });
});

describe('initialsOf', () => {
  it.each([
    ['Grace Chapel', 'GC'],
    ['Cornerstone', 'C'],
    ['Still Waters Devotionals', 'SW'],
    ['', '?'],
  ])('reduces %s to %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
