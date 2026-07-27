import * as Location from "expo-location";

export const CITY_COORDS = {
  doha: { lat: 25.2854, lng: 51.531 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  london: { lat: 51.5072, lng: -0.1276 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
};

export async function getDeviceLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Permission denied");
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
}

export function distanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Nearest of the supported cities to a raw GPS fix. */
export function nearestCity({ latitude, longitude }) {
  const from = { lat: latitude, lng: longitude };
  let best = null;
  for (const [id, coords] of Object.entries(CITY_COORDS)) {
    const d = distanceKm(from, coords);
    if (!best || d < best.distance) best = { id, distance: d, coords };
  }
  return best;
}

export function coordsForCity(cityId) {
  if (!cityId) return null;
  return CITY_COORDS[String(cityId).toLowerCase()] || null;
}

/** Accepts {lat,lng} or {latitude,longitude} and normalises to {lat,lng}. */
export function normalizeCoords(coords) {
  if (!coords) return null;
  const lat = coords.lat ?? coords.latitude;
  const lng = coords.lng ?? coords.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return "less than a km away";
  return `${Math.round(km)} km away`;
}
