import { getDoc, setDoc } from "firebase/firestore";

import { matchIdFor, recordSwipe } from "../matching";

jest.mock("../../config/firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: (...path) => ({ path }),
  doc: (_db, ...path) => ({ path: path.join("/") }),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: (...args) => args,
  serverTimestamp: () => "SERVER_TIMESTAMP",
  setDoc: jest.fn(async () => {}),
  where: (...args) => args,
}));

const missing = { exists: () => false };
const likedBack = { exists: () => true, data: () => ({ action: "like" }) };
const passedBack = { exists: () => true, data: () => ({ action: "pass" }) };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("matchIdFor", () => {
  it("sorts the pair so both sides derive the same id", () => {
    expect(matchIdFor("zoe", "adam")).toBe("adam_zoe");
    expect(matchIdFor("adam", "zoe")).toBe("adam_zoe");
  });
});

describe("recordSwipe", () => {
  it("writes the swipe under a deterministic id", async () => {
    getDoc.mockResolvedValue(missing);
    await recordSwipe({ swiperUid: "me", targetUid: "you", action: "like" });
    expect(setDoc).toHaveBeenCalledWith(
      { path: "swipes/me_you" },
      expect.objectContaining({ swiperUid: "me", targetUid: "you", action: "like" })
    );
  });

  it("never looks for a reverse like after a pass", async () => {
    const result = await recordSwipe({ swiperUid: "me", targetUid: "you", action: "pass" });
    expect(getDoc).not.toHaveBeenCalled();
    expect(result).toEqual({ matched: false });
  });

  it("creates the match when the like is mutual", async () => {
    getDoc.mockResolvedValue(likedBack);
    const result = await recordSwipe({ swiperUid: "zoe", targetUid: "adam", action: "like" });
    expect(result.matched).toBe(true);
    expect(result.matchId).toBe("adam_zoe");
    expect(setDoc).toHaveBeenCalledWith(
      { path: "matches/adam_zoe" },
      expect.objectContaining({ users: ["zoe", "adam"] })
    );
  });

  it("does not match when the other side has not swiped yet", async () => {
    getDoc.mockResolvedValue(missing);
    const result = await recordSwipe({ swiperUid: "me", targetUid: "you", action: "like" });
    expect(result).toEqual({ matched: false });
    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("does not match when the other side passed", async () => {
    getDoc.mockResolvedValue(passedBack);
    const result = await recordSwipe({ swiperUid: "me", targetUid: "you", action: "like" });
    expect(result).toEqual({ matched: false });
  });
});
