import { AGE_BOUNDS, DISTANCE_BOUNDS } from "../config/appConfig";
import { distanceKm, normalizeCoords } from "./geolocation";
import { matchesShowMe } from "./profiles";

/**
 * Builds the discovery deck. Firestore can't index every discovery filter in
 * one composite query, so the seed pool is narrowed here and sorted nearest
 * first. Profiles with no coordinates are kept rather than hidden — a missing
 * field shouldn't silently shrink the deck.
 */
export function buildDeck(profiles, { myUid, myCoords, swipedUids, settings } = {}) {
  const swiped = swipedUids || new Set();
  const [minAge, maxAge] = settings?.ageRange || [AGE_BOUNDS.min, AGE_BOUNDS.max];
  const maxDistance = settings?.maxDistanceKm ?? DISTANCE_BOUNDS.max;
  const wantedIntents = settings?.intents || [];
  const from = normalizeCoords(myCoords);

  return (profiles || [])
    .filter((p) => p?.uid && p.uid !== myUid)
    .filter((p) => !swiped.has(p.uid))
    .filter((p) => matchesShowMe(p, settings?.showMe))
    .filter((p) => !p.age || (p.age >= minAge && p.age <= maxAge))
    .filter(
      (p) => !wantedIntents.length || (p.intents || []).some((i) => wantedIntents.includes(i))
    )
    .map((p) => {
      const to = normalizeCoords(p.coords);
      return { ...p, distance: from && to ? distanceKm(from, to) : null };
    })
    .filter((p) => settings?.globalMode || p.distance == null || p.distance <= maxDistance)
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

export default buildDeck;
