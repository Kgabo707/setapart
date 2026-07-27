import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential } from "firebase/auth";

import { auth } from "../config/firebase";
import { useAuth } from "./useAuth";

WebBrowser.maybeCompleteAuthSession();

/**
 * Native apps cannot use signInWithPopup, so Google goes through
 * expo-auth-session and Apple through the native Sign in with Apple sheet;
 * both hand an OIDC credential to Firebase Auth.
 */
export function useSocialAuth() {
  const { ensureUserDoc } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const clientIds = useMemo(
    () => ({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    }),
    []
  );

  const googleConfigured = Boolean(
    clientIds.webClientId || clientIds.iosClientId || clientIds.androidClientId
  );

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(clientIds);
  const [pendingGoogle, setPendingGoogle] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (!pendingGoogle || !response) return;
    if (response.type !== "success") {
      if (response.type === "error") setError(response.error?.message || "Google sign-in failed");
      setPendingGoogle(false);
      setBusy(null);
      return;
    }
    const idToken = response.params?.id_token ?? response.authentication?.idToken;
    if (!idToken) {
      setError("Google did not return an ID token");
      setPendingGoogle(false);
      setBusy(null);
      return;
    }
    signInWithCredential(auth, GoogleAuthProvider.credential(idToken))
      .then(async (cred) => {
        const { isNewUser } = await ensureUserDoc(cred.user);
        setResult({ isNewUser, user: cred.user });
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setPendingGoogle(false);
        setBusy(null);
      });
  }, [response, pendingGoogle, ensureUserDoc]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!googleConfigured) {
      setError("Google sign-in is not configured. Add the OAuth client ids to .env.");
      return;
    }
    setBusy("google");
    setPendingGoogle(true);
    const res = await promptAsync();
    if (res?.type !== "success") {
      setPendingGoogle(false);
      setBusy(null);
    }
  }, [googleConfigured, promptAsync]);

  const signInWithApple = useCallback(async () => {
    setError(null);
    setBusy("apple");
    try {
      const nonce = Math.random().toString(36).slice(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      const provider = new OAuthProvider("apple.com");
      const cred = provider.credential({ idToken: credential.identityToken, rawNonce: nonce });
      const signed = await signInWithCredential(auth, cred);
      // Apple only sends the name on the very first authorisation.
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(" ");
      const { isNewUser } = await ensureUserDoc(
        signed.user,
        fullName ? { name: fullName, displayName: credential.fullName?.givenName || fullName } : {}
      );
      setResult({ isNewUser, user: signed.user });
      return { isNewUser, user: signed.user };
    } catch (err) {
      if (err?.code !== "ERR_REQUEST_CANCELED") setError(err.message);
      return null;
    } finally {
      setBusy(null);
    }
  }, [ensureUserDoc]);

  return {
    signInWithGoogle,
    signInWithApple,
    googleReady: Boolean(request) && googleConfigured,
    appleAvailable,
    busy,
    error,
    result,
    clearError: () => setError(null),
  };
}

export default useSocialAuth;
