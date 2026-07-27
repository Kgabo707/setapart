import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "../config/firebase";

const MESSAGE_WINDOW = 200;
const BOT_TYPING_TIMEOUT_MS = 20000;

/**
 * Streams a conversation's messages newest-first (the FlatList is inverted).
 * The bot reply is written by the onMessageSent Cloud Function, so "typing"
 * means: the last message is ours and no bot reply has landed yet.
 */
export function useMessages(matchId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(matchId));
  const [botTyping, setBotTyping] = useState(false);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!matchId || !isFirebaseConfigured) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }
    const q = query(
      collection(db, "conversations", matchId, "messages"),
      orderBy("createdAt", "desc"),
      limit(MESSAGE_WINDOW)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [matchId]);

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    []
  );

  const startBotTyping = () => {
    setBotTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setBotTyping(false), BOT_TYPING_TIMEOUT_MS);
  };

  const stopBotTyping = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setBotTyping(false);
  };

  return { messages, loading, botTyping, startBotTyping, stopBotTyping };
}

export async function sendMessage({ matchId, senderId, users, text, type = "text", ...rest }) {
  await addDoc(collection(db, "conversations", matchId, "messages"), {
    senderId,
    text,
    type,
    isBot: false,
    createdAt: serverTimestamp(),
    ...rest,
  });
  await setDoc(
    doc(db, "conversations", matchId),
    {
      matchId,
      ...(users ? { users } : {}),
      lastMessage: type === "voice" ? "🎤 Voice note" : text,
      lastMessageAt: serverTimestamp(),
      unreadCount: 0,
    },
    { merge: true }
  );
}

export async function markConversationRead(matchId) {
  if (!matchId) return;
  await setDoc(doc(db, "conversations", matchId), { unreadCount: 0 }, { merge: true }).catch(
    () => {}
  );
}

export default useMessages;
