import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db, isFirebaseConfigured } from "../config/firebase";

export function useConversations(uid) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !isFirebaseConfigured) {
      setConversations([]);
      setLoading(false);
      return undefined;
    }
    const q = query(
      collection(db, "conversations"),
      where("users", "array-contains", uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { conversations, loading, error };
}

export default useConversations;
