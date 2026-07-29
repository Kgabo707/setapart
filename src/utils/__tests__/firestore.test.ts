import { omitUndefined } from '../firestore';

/**
 * This exists because of a real production bug: Firestore's addDoc/setDoc reject any
 * key whose value is `undefined` (as opposed to the key being absent), which an
 * optional form field like `location.trim() || undefined` produces constantly. Demo
 * mode never exercises the real Firestore call, so the test suite couldn't catch this
 * until it broke for an actual user — this test is here so it can't happen silently
 * again.
 */
describe('omitUndefined', () => {
  it('drops keys whose value is undefined', () => {
    expect(omitUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('keeps falsy-but-defined values (0, "", false, null)', () => {
    expect(omitUndefined({ a: 0, b: '', c: false, d: null })).toEqual({
      a: 0,
      b: '',
      c: false,
      d: null,
    });
  });

  it('returns an equivalent object when nothing is undefined', () => {
    const input = { title: 'A video', tags: ['a', 'b'] };
    expect(omitUndefined(input)).toEqual(input);
  });
});
