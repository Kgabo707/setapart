import { formatDuration, initialsOf, relativeTime, toDate } from "../format";

describe("toDate", () => {
  it("unwraps a Firestore Timestamp", () => {
    const date = new Date("2024-05-01T10:00:00Z");
    expect(toDate({ toDate: () => date })).toBe(date);
  });

  it("accepts the raw {seconds} shape a Timestamp serialises to", () => {
    expect(toDate({ seconds: 1714557600 }).getTime()).toBe(1714557600 * 1000);
  });

  it("returns null for missing or unparseable values", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate("not a date")).toBeNull();
  });
});

describe("relativeTime", () => {
  it("collapses the last minute to 'now'", () => {
    expect(relativeTime(new Date(Date.now() - 5_000))).toBe("now");
  });

  it("uses minutes, then hours, then days", () => {
    expect(relativeTime(new Date(Date.now() - 5 * 60_000))).toBe("5m");
    expect(relativeTime(new Date(Date.now() - 3 * 3_600_000))).toBe("3h");
    expect(relativeTime(new Date(Date.now() - 2 * 86_400_000))).toBe("2d");
  });

  it("is empty when there is no timestamp yet", () => {
    expect(relativeTime(undefined)).toBe("");
  });
});

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9)).toBe("0:09");
    expect(formatDuration(75)).toBe("1:15");
  });

  it("clamps negatives and rounds fractions", () => {
    expect(formatDuration(-4)).toBe("0:00");
    expect(formatDuration(12.6)).toBe("0:13");
  });
});

describe("initialsOf", () => {
  it("takes at most two initials", () => {
    expect(initialsOf("Amira Haddad")).toBe("AH");
    expect(initialsOf("Jean Luc Pierre Dupont")).toBe("JL");
  });

  it("is empty for a missing name", () => {
    expect(initialsOf("")).toBe("");
  });
});
