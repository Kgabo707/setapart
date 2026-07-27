import { useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";

import { VIBE_DEBOUNCE_MS, VIBE_TIERS } from "../config/appConfig";
import { functions, isFirebaseConfigured } from "../config/firebase";

const MIN_CHARS = 4;

export function vibeTierFor(score) {
  return VIBE_TIERS.find((tier) => score >= tier.min) || VIBE_TIERS[VIBE_TIERS.length - 1];
}

/**
 * Scores the message draft with the vibeScore Cloud Function, debounced so a
 * fast typist triggers one call instead of one per keystroke.
 */
export function useVibeCheck(draft, { enabled = true, matchId } = {}) {
  const [vibe, setVibe] = useState(null);
  const [scoring, setScoring] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured || draft.trim().length < MIN_CHARS) {
      setVibe(null);
      setScoring(false);
      return undefined;
    }

    const id = ++requestId.current;
    setScoring(true);
    const timeout = setTimeout(async () => {
      try {
        const vibeScore = httpsCallable(functions, "vibeScore");
        const res = await vibeScore({ text: draft, matchId });
        if (id !== requestId.current) return; // a newer draft won
        const data = res?.data || {};
        const score = Math.max(0, Math.min(100, Number(data.score) || 0));
        setVibe({
          score,
          tip: data.tip || data.coachingTip || null,
          label: data.label || vibeTierFor(score).label,
          color: vibeTierFor(score).color,
        });
      } catch {
        if (id === requestId.current) setVibe(null);
      } finally {
        if (id === requestId.current) setScoring(false);
      }
    }, VIBE_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [draft, enabled, matchId]);

  return { vibe, scoring };
}

export default useVibeCheck;
