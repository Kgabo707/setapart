import { useCallback, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";

import { functions, isFirebaseConfigured } from "../config/firebase";
import { useAuth } from "./useAuth";

/**
 * Plan lives in Firestore and is written by the PayFast webhook, so the
 * callable is authoritative. The user doc is used as an instant fallback while
 * the callable resolves (and when it is unreachable offline).
 */
export function usePlan() {
  const { user, profile } = useAuth();
  const fallbackPlan = profile?.plan || "free";
  const [plan, setPlan] = useState(fallbackPlan);
  const [planExpiry, setPlanExpiry] = useState(profile?.planExpiry || null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !isFirebaseConfigured) return fallbackPlan;
    setLoading(true);
    try {
      const getUserPlan = httpsCallable(functions, "getUserPlan");
      const res = await getUserPlan({ uid: user.uid });
      const data = res?.data || {};
      const next = data.plan || fallbackPlan;
      setPlan(next);
      setPlanExpiry(data.planExpiry || null);
      return next;
    } catch {
      setPlan(fallbackPlan);
      return fallbackPlan;
    } finally {
      setLoading(false);
    }
  }, [user, fallbackPlan]);

  useEffect(() => {
    setPlan(fallbackPlan);
  }, [fallbackPlan]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    plan,
    planExpiry,
    loading,
    isPremium: plan === "premium",
    refresh,
  };
}

export default usePlan;
