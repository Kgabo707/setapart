/**
 * Firestore rejects any field whose value is explicitly `undefined` — it's treated
 * differently from the key being absent entirely, and `addDoc`/`setDoc` throw
 * "Unsupported field value: undefined" rather than silently dropping it. Any object
 * built from optional form fields (`location.trim() || undefined`, and similar) needs
 * to go through this before being handed to a write, or it'll fail exactly like that.
 */
export const omitUndefined = <T extends Record<string, unknown>>(value: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as (keyof T)[]) {
    if (value[key] !== undefined) result[key] = value[key];
  }
  return result;
};
