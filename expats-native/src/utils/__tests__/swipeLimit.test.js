import AsyncStorage from "@react-native-async-storage/async-storage";

import { FREE_SWIPES_PER_DAY } from "../../config/appConfig";
import {
  getSwipeCount,
  incrementSwipeCount,
  resetSwipeCount,
  swipesRemaining,
} from "../swipeLimit";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("daily swipe accounting", () => {
  it("starts at zero for a new user", async () => {
    await expect(getSwipeCount("user-1")).resolves.toBe(0);
  });

  it("counts swipes per user", async () => {
    await incrementSwipeCount("user-1");
    await incrementSwipeCount("user-1");
    await incrementSwipeCount("user-2");
    await expect(getSwipeCount("user-1")).resolves.toBe(2);
    await expect(getSwipeCount("user-2")).resolves.toBe(1);
  });

  it("keys the counter by day so it rolls over at midnight", async () => {
    await incrementSwipeCount("user-1");
    const keys = await AsyncStorage.getAllKeys();
    expect(keys[0]).toMatch(/^expats:swipeCount:user-1:\d{4}-\d{2}-\d{2}$/);
  });

  it("can be reset", async () => {
    await incrementSwipeCount("user-1");
    await resetSwipeCount("user-1");
    await expect(getSwipeCount("user-1")).resolves.toBe(0);
  });

  it("ignores a missing uid instead of throwing", async () => {
    await expect(getSwipeCount(undefined)).resolves.toBe(0);
    await expect(incrementSwipeCount(undefined)).resolves.toBe(0);
  });
});

describe("swipesRemaining", () => {
  it("counts down from the free daily allowance", () => {
    expect(swipesRemaining(0, false)).toBe(FREE_SWIPES_PER_DAY);
    expect(swipesRemaining(29, false)).toBe(1);
  });

  it("never goes negative", () => {
    expect(swipesRemaining(FREE_SWIPES_PER_DAY + 5, false)).toBe(0);
  });

  it("is unlimited on premium", () => {
    expect(swipesRemaining(999, true)).toBe(Infinity);
  });
});
