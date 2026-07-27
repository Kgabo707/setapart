import {
  CITY_COORDS,
  coordsForCity,
  distanceKm,
  formatDistance,
  nearestCity,
  normalizeCoords,
} from "../geolocation";

describe("distanceKm", () => {
  it("returns zero for the same point", () => {
    expect(distanceKm(CITY_COORDS.doha, CITY_COORDS.doha)).toBe(0);
  });

  it("matches the known great-circle distance between Doha and Dubai", () => {
    // Roughly 380 km apart.
    expect(distanceKm(CITY_COORDS.doha, CITY_COORDS.dubai)).toBeCloseTo(380, -1);
  });

  it("is symmetric", () => {
    const there = distanceKm(CITY_COORDS.london, CITY_COORDS.lisbon);
    const back = distanceKm(CITY_COORDS.lisbon, CITY_COORDS.london);
    expect(there).toBeCloseTo(back, 6);
  });

  it("handles antimeridian-spanning pairs without going negative", () => {
    expect(distanceKm({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeGreaterThan(0);
  });
});

describe("nearestCity", () => {
  it("picks the closest supported city to a GPS fix", () => {
    const fix = { latitude: 25.3, longitude: 51.5 }; // just outside Doha
    expect(nearestCity(fix).id).toBe("doha");
  });

  it("returns the distance alongside the city", () => {
    const result = nearestCity({ latitude: 51.51, longitude: -0.13 });
    expect(result.id).toBe("london");
    expect(result.distance).toBeLessThan(5);
  });
});

describe("coordsForCity", () => {
  it("is case-insensitive", () => {
    expect(coordsForCity("LISBON")).toEqual(CITY_COORDS.lisbon);
  });

  it("returns null for unknown or missing cities", () => {
    expect(coordsForCity("atlantis")).toBeNull();
    expect(coordsForCity(null)).toBeNull();
  });
});

describe("normalizeCoords", () => {
  it("accepts both the Firestore and expo-location shapes", () => {
    expect(normalizeCoords({ lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
    expect(normalizeCoords({ latitude: 1, longitude: 2 })).toEqual({ lat: 1, lng: 2 });
  });

  it("rejects partial or missing coordinates", () => {
    expect(normalizeCoords(null)).toBeNull();
    expect(normalizeCoords({ lat: 1 })).toBeNull();
  });
});

describe("formatDistance", () => {
  it("rounds to whole kilometres", () => {
    expect(formatDistance(12.4)).toBe("12 km away");
  });

  it("has a friendly form for sub-kilometre distances", () => {
    expect(formatDistance(0.3)).toBe("less than a km away");
  });

  it("returns null when the distance is unknown", () => {
    expect(formatDistance(null)).toBeNull();
  });
});
