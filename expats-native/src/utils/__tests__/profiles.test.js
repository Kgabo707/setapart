import {
  displayNameOf,
  galleryPhotos,
  genderForShowMe,
  mainPhoto,
  matchesShowMe,
  normalizeGender,
  subtitleOf,
} from "../profiles";

describe("gender mapping", () => {
  it("maps the plural showMe setting onto the singular Firestore value", () => {
    expect(genderForShowMe("men")).toBe("man");
    expect(genderForShowMe("women")).toBe("woman");
  });

  it("treats everyone as no filter at all", () => {
    expect(genderForShowMe("everyone")).toBeNull();
  });

  it("filters profiles by the mapped gender", () => {
    const man = { gender: "man" };
    const woman = { gender: "woman" };
    expect(matchesShowMe(man, "men")).toBe(true);
    expect(matchesShowMe(man, "women")).toBe(false);
    expect(matchesShowMe(woman, "women")).toBe(true);
    expect(matchesShowMe(woman, "everyone")).toBe(true);
  });

  it("never silently drops profiles when showMe is everyone", () => {
    expect(matchesShowMe({}, "everyone")).toBe(true);
  });

  it("normalises stray plural or capitalised values", () => {
    expect(normalizeGender("Women")).toBe("woman");
    expect(normalizeGender("MAN")).toBe("man");
    expect(normalizeGender(undefined)).toBeNull();
  });
});

describe("photo helpers", () => {
  it("prefers the main photo", () => {
    expect(mainPhoto({ photos: { main: "a.jpg", gallery: ["b.jpg"] } })).toBe("a.jpg");
  });

  it("falls back to the first gallery photo", () => {
    expect(mainPhoto({ photos: { gallery: ["b.jpg"] } })).toBe("b.jpg");
  });

  it("returns null when there are no photos", () => {
    expect(mainPhoto({})).toBeNull();
  });

  it("puts the main photo first in the gallery without duplicating it", () => {
    const photos = galleryPhotos({ photos: { main: "a.jpg", gallery: ["a.jpg", "b.jpg"] } });
    expect(photos).toEqual(["a.jpg", "b.jpg"]);
  });
});

describe("display helpers", () => {
  it("prefers the display name over the private name", () => {
    expect(displayNameOf({ name: "Amira Haddad", displayName: "Amira" })).toBe("Amira");
  });

  it("has a fallback for unresolved profiles", () => {
    expect(displayNameOf(null)).toBe("Someone");
  });

  it("joins nationality and job, skipping missing parts", () => {
    expect(subtitleOf({ nationality: "Lebanese", job: "Architect" })).toBe(
      "Lebanese · Architect"
    );
    expect(subtitleOf({ nationality: "Lebanese" })).toBe("Lebanese");
  });
});
