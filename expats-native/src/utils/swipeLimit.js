import AsyncStorage from "@react-native-async-storage/async-storage";

import { FREE_SWIPES_PER_DAY } from "../config/appConfig";

const KEY_PREFIX = "expats:swipeCount:";

function todayKey(uid) {
  const day = new Date().toISOString().slice(0, 10);
  return `${KEY_PREFIX}${uid}:${day}`;
}

export async function getSwipeCount(uid) {
  if (!uid) return 0;
  const raw = await AsyncStorage.getItem(todayKey(uid));
  return raw ? Number(raw) || 0 : 0;
}

export async function incrementSwipeCount(uid) {
  if (!uid) return 0;
  const next = (await getSwipeCount(uid)) + 1;
  await AsyncStorage.setItem(todayKey(uid), String(next));
  return next;
}

export async function resetSwipeCount(uid) {
  if (!uid) return;
  await AsyncStorage.removeItem(todayKey(uid));
}

export function swipesRemaining(count, isPremium) {
  if (isPremium) return Infinity;
  return Math.max(0, FREE_SWIPES_PER_DAY - count);
}
