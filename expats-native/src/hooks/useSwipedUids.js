import { useCallback, useEffect, useState } from "react";

import { isFirebaseConfigured } from "../config/firebase";
import { getSwipedUids } from "../utils/matching";

export function useSwipedUids(uid) {
  const [swipedUids, setSwipedUids] = useState(() => new Set());
  const [loading, setLoading] = useState(Boolean(uid));

  const load = useCallback(async () => {
    if (!uid || !isFirebaseConfigured) {
      setSwipedUids(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setSwipedUids(await getSwipedUids(uid));
    } catch {
      setSwipedUids(new Set());
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  // Local echo so a swiped card never comes back before the next refetch.
  const markSwiped = useCallback((targetUid) => {
    setSwipedUids((prev) => {
      const next = new Set(prev);
      next.add(targetUid);
      return next;
    });
  }, []);

  return { swipedUids, loading, markSwiped, reload: load };
}

export default useSwipedUids;
