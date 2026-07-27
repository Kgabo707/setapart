/**
 * Firestore stores gender as "man" / "woman" (singular) while the discovery
 * setting uses "men" / "women" (plural). Every gender comparison must go
 * through here.
 */
export function genderForShowMe(showMe) {
  if (showMe === "men") return "man";
  if (showMe === "women") return "woman";
  return null; // "everyone"
}

export function matchesShowMe(profile, showMe) {
  const wanted = genderForShowMe(showMe);
  if (!wanted) return true;
  return normalizeGender(profile?.gender) === wanted;
}

export function normalizeGender(gender) {
  if (!gender) return null;
  const value = String(gender).toLowerCase();
  if (value === "men") return "man";
  if (value === "women") return "woman";
  return value;
}

export function mainPhoto(profile) {
  return (
    profile?.photos?.main ||
    profile?.photos?.gallery?.[0] ||
    profile?.photoURL ||
    null
  );
}

export function galleryPhotos(profile) {
  const gallery = profile?.photos?.gallery || [];
  const main = profile?.photos?.main;
  const all = main ? [main, ...gallery.filter((p) => p !== main)] : [...gallery];
  return all.filter(Boolean);
}

export function displayNameOf(profile) {
  return profile?.displayName || profile?.name || "Someone";
}

export function subtitleOf(profile) {
  return [profile?.nationality, profile?.job].filter(Boolean).join(" · ");
}
