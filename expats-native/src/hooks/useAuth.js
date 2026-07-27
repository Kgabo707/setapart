import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db, isFirebaseConfigured } from "../config/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInitializing(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setInitializing(false);
      }
    });
  }, []);

  // The Firestore user doc is the source of truth for onboarding + plan, so it
  // is streamed rather than read once.
  useEffect(() => {
    if (!user) return undefined;
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        setProfile(snap.exists() ? { uid: user.uid, ...snap.data() } : null);
        setInitializing(false);
      },
      () => setInitializing(false)
    );
    return unsub;
  }, [user]);

  const ensureUserDoc = useCallback(async (fbUser, extra = {}) => {
    const ref = doc(db, "users", fbUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return { isNewUser: false, data: snap.data() };
    const data = {
      name: fbUser.displayName || "",
      displayName: fbUser.displayName || "",
      email: fbUser.email || "",
      provider: fbUser.providerData?.[0]?.providerId || "password",
      onboardingComplete: false,
      plan: "free",
      createdAt: serverTimestamp(),
      ...extra,
    };
    await setDoc(ref, data, { merge: true });
    return { isNewUser: true, data };
  }, []);

  const signInWithEmail = useCallback(
    async (email, password) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user);
      return cred.user;
    },
    [ensureUserDoc]
  );

  const signUpWithEmail = useCallback(
    async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user, name ? { name, displayName: name } : {});
      return cred.user;
    },
    [ensureUserDoc]
  );

  const signOut = useCallback(() => fbSignOut(auth), []);

  const value = useMemo(
    () => ({
      user,
      profile,
      initializing,
      isSignedIn: Boolean(user),
      onboardingComplete: Boolean(profile?.onboardingComplete),
      ensureUserDoc,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, profile, initializing, ensureUserDoc, signInWithEmail, signUpWithEmail, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export async function saveOnboardingData(uid, data) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, onboardingComplete: true, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
