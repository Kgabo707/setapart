import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebase";

export function matchIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

export async function recordSwipe({ swiperUid, targetUid, action }) {
  await setDoc(doc(db, "swipes", `${swiperUid}_${targetUid}`), {
    swiperUid,
    targetUid,
    action,
    createdAt: serverTimestamp(),
  });
  if (action !== "like") return { matched: false };

  const reverse = await getDoc(doc(db, "swipes", `${targetUid}_${swiperUid}`));
  if (reverse.exists() && reverse.data().action === "like") {
    const id = matchIdFor(swiperUid, targetUid);
    await setDoc(doc(db, "matches", id), {
      users: [swiperUid, targetUid],
      createdAt: serverTimestamp(),
    });
    return { matched: true, matchId: id };
  }
  return { matched: false };
}

export async function getSwipedUids(uid) {
  const q = query(collection(db, "swipes"), where("swiperUid", "==", uid));
  const snap = await getDocs(q);
  return new Set(snap.docs.map((d) => d.data().targetUid));
}

export async function getLikedByUids(uid) {
  const q = query(
    collection(db, "swipes"),
    where("targetUid", "==", uid),
    where("action", "==", "like")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().swiperUid);
}

export async function getMatchIds(uid) {
  const q = query(collection(db, "matches"), where("users", "array-contains", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}
