import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

import type { AppUser } from '../../types/models';
import { demoStore, hydrateDemoState } from '../demo/demoStore';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase';
import { createUserProfile, getUserProfile } from './users';

export type AuthIdentity = { uid: string; email: string; displayName: string };

export type Session = { identity: AuthIdentity; profile: AppUser };

type SessionListener = (session: Session | null) => void;

/** Demo mode has no Firebase auth stream, so subscribers are notified manually. */
const demoListeners = new Set<SessionListener>();

const toSession = (profile: AppUser): Session => ({
  identity: { uid: profile.id, email: profile.email, displayName: profile.displayName },
  profile,
});

const notifyDemoListeners = (profile: AppUser | null) => {
  const session = profile ? toSession(profile) : null;
  demoListeners.forEach((listener) => listener(session));
};

const fromFirebaseUser = (user: FirebaseUser): AuthIdentity => ({
  uid: user.uid,
  email: user.email ?? '',
  displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Friend',
});

/**
 * Emits the current identity and its profile document, then again on every auth change.
 * Returns an unsubscribe function.
 */
export const observeSession = (onChange: SessionListener): (() => void) => {
  if (!isFirebaseConfigured) {
    let cancelled = false;
    demoListeners.add(onChange);
    void hydrateDemoState().then(async () => {
      if (cancelled) return;
      const userId = demoStore.getState().signedInUserId;
      const profile = userId ? await getUserProfile(userId) : null;
      onChange(profile ? toSession(profile) : null);
    });
    return () => {
      cancelled = true;
      demoListeners.delete(onChange);
    };
  }

  return onAuthStateChanged(getFirebaseAuth(), async (user) => {
    if (!user) {
      onChange(null);
      return;
    }
    const identity = fromFirebaseUser(user);
    const profile =
      (await getUserProfile(identity.uid)) ??
      (await createUserProfile(identity.uid, {
        displayName: identity.displayName,
        email: identity.email,
      }));
    onChange({ identity, profile });
  });
};

export const signIn = async (email: string, password: string): Promise<void> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    const existing = demoStore.findUserByEmail(email);
    const profile =
      existing ??
      (await createUserProfile(`user-${Date.now()}`, {
        displayName: email.split('@')[0] ?? 'Friend',
        email: email.trim(),
      }));
    demoStore.setSignedInUser(profile.id);
    notifyDemoListeners(profile);
    return;
  }

  await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
};

export const signUp = async (
  displayName: string,
  email: string,
  password: string,
): Promise<void> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    if (demoStore.findUserByEmail(email)) {
      throw new Error('An account with that email already exists.');
    }
    const profile = await createUserProfile(`user-${Date.now()}`, {
      displayName: displayName.trim(),
      email: email.trim(),
    });
    demoStore.setSignedInUser(profile.id);
    notifyDemoListeners(profile);
    return;
  }

  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  await updateProfile(credential.user, { displayName: displayName.trim() });
  await createUserProfile(credential.user.uid, {
    displayName: displayName.trim(),
    email: email.trim(),
  });
};

export const signOut = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    await hydrateDemoState();
    demoStore.setSignedInUser(null);
    notifyDemoListeners(null);
    return;
  }
  await fbSignOut(getFirebaseAuth());
};

/** Maps Firebase error codes to copy we are willing to show a visitor. */
export const describeAuthError = (error: unknown): string => {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look right.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'We could not match that email and password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network unavailable. Check your connection and try again.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Something went wrong. Please try again.';
  }
};
