import { DISCOVERY_DEFAULTS } from "../../config/appConfig";
import { buildDeck } from "../deck";
import { CITY_COORDS } from "../geolocation";

const doha = { lat: CITY_COORDS.doha.lat, lng: CITY_COORDS.doha.lng };

const profiles = [
  {
    uid: "w-doha",
    gender: "woman",
    age: 29,
    coords: CITY_COORDS.doha,
    intents: ["serious", "friendship"],
  },
  {
    uid: "m-doha",
    gender: "man",
    age: 34,
    coords: CITY_COORDS.doha,
    intents: ["casual"],
  },
  {
    uid: "w-london",
    gender: "woman",
    age: 41,
    coords: CITY_COORDS.london,
    intents: ["networking"],
  },
];

function deck(overrides = {}) {
  return buildDeck(profiles, {
    myUid: "me",
    myCoords: doha,
    swipedUids: new Set(),
    settings: DISCOVERY_DEFAULTS,
    ...overrides,
  }).map((p) => p.uid);
}

describe("buildDeck gender filter", () => {
  it("maps the plural showMe onto the singular stored gender", () => {
    expect(deck({ settings: { ...DISCOVERY_DEFAULTS, showMe: "men", globalMode: true } })).toEqual([
      "m-doha",
    ]);
    expect(
      deck({ settings: { ...DISCOVERY_DEFAULTS, showMe: "women", globalMode: true } })
    ).toEqual(["w-doha", "w-london"]);
  });

  it("shows every gender on everyone", () => {
    expect(deck({ settings: { ...DISCOVERY_DEFAULTS, globalMode: true } })).toHaveLength(3);
  });
});

describe("buildDeck exclusions", () => {
  it("drops profiles the user already swiped", () => {
    expect(
      deck({
        swipedUids: new Set(["m-doha"]),
        settings: { ...DISCOVERY_DEFAULTS, globalMode: true },
      })
    ).toEqual(["w-doha", "w-london"]);
  });

  it("never shows the user their own profile", () => {
    expect(deck({ myUid: "m-doha", settings: { ...DISCOVERY_DEFAULTS, globalMode: true } })).toEqual(
      ["w-doha", "w-london"]
    );
  });

  it("respects the age range", () => {
    expect(
      deck({ settings: { ...DISCOVERY_DEFAULTS, ageRange: [18, 30], globalMode: true } })
    ).toEqual(["w-doha"]);
  });

  it("filters by intent when categories are selected", () => {
    expect(
      deck({ settings: { ...DISCOVERY_DEFAULTS, intents: ["casual"], globalMode: true } })
    ).toEqual(["m-doha"]);
  });

  it("treats an empty intent list as no filter", () => {
    expect(deck({ settings: { ...DISCOVERY_DEFAULTS, intents: [], globalMode: true } })).toHaveLength(
      3
    );
  });
});

describe("buildDeck distance handling", () => {
  it("hides profiles beyond the radius", () => {
    expect(deck({ settings: { ...DISCOVERY_DEFAULTS, maxDistanceKm: 50 } })).toEqual([
      "w-doha",
      "m-doha",
    ]);
  });

  it("ignores the radius in global mode", () => {
    expect(deck({ settings: { ...DISCOVERY_DEFAULTS, maxDistanceKm: 50, globalMode: true } })).toContain(
      "w-london"
    );
  });

  it("sorts nearest first", () => {
    const result = buildDeck(profiles, {
      myUid: "me",
      myCoords: CITY_COORDS.london,
      swipedUids: new Set(),
      settings: { ...DISCOVERY_DEFAULTS, globalMode: true },
    });
    expect(result[0].uid).toBe("w-london");
  });

  it("keeps profiles with no coordinates rather than hiding them", () => {
    const result = buildDeck([{ uid: "nowhere", gender: "woman", age: 30 }], {
      myUid: "me",
      myCoords: doha,
      settings: DISCOVERY_DEFAULTS,
    });
    expect(result.map((p) => p.uid)).toEqual(["nowhere"]);
    expect(result[0].distance).toBeNull();
  });

  it("copes with the user having no location yet", () => {
    const result = buildDeck(profiles, {
      myUid: "me",
      myCoords: null,
      settings: DISCOVERY_DEFAULTS,
    });
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.distance === null)).toBe(true);
  });
});

describe("buildDeck robustness", () => {
  it("returns an empty deck for missing input", () => {
    expect(buildDeck(undefined)).toEqual([]);
    expect(buildDeck([])).toEqual([]);
  });

  it("skips malformed profiles with no uid", () => {
    expect(buildDeck([{ gender: "woman" }], { settings: DISCOVERY_DEFAULTS })).toEqual([]);
  });
});
