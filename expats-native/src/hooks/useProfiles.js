import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "../config/firebase";

const PROFILE_PAGE_SIZE = 400;

/**
 * Loads the seed profile pool. The deck filters client-side because the
 * discovery filters (distance, age, intents) span more fields than Firestore
 * can index in a single composite query.
 */
export function useProfiles({ gender } = {}) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const constraints = [limit(PROFILE_PAGE_SIZE)];
      if (gender) constraints.unshift(where("gender", "==", gender));
      const snap = await getDocs(query(collection(db, "profiles"), ...constraints));
      setProfiles(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [gender]);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, loading, error, reload: load };
}

/** Seed bots live in /profiles, real people in /users. */
export async function fetchProfile(uid) {
  if (!uid) return null;
  const seed = await getDoc(doc(db, "profiles", uid));
  if (seed.exists()) return { uid, isSeed: true, ...seed.data() };
  const real = await getDoc(doc(db, "users", uid));
  if (real.exists()) return { uid, isSeed: false, ...real.data() };
  return null;
}

export function useProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchProfile(uid)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return { profile, loading };
}
