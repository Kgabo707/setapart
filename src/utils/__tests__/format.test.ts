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
