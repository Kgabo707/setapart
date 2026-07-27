import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc } from "firebase/firestore";

import { DISCOVERY_DEFAULTS } from "../config/appConfig";
import { db, isFirebaseConfigured } from "../config/firebase";
import { useAuth } from "./useAuth";

const STORAGE_KEY = "expats:discoverySettings";
const DiscoverySettingsContext = createContext(null);

export function DiscoverySettingsProvider({ children }) {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState(DISCOVERY_DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...DISCOVERY_DEFAULTS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  // Settings saved on another device win once the user doc arrives.
  useEffect(() => {
    if (!hydrated || !profile?.discoverySettings) return;
    setSettings((prev) => ({ ...prev, ...profile.discoverySettings }));
  }, [hydrated, profile?.discoverySettings]);

  const update = useCallback(
    (patch) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        if (user && isFirebaseConfigured) {
          setDoc(doc(db, "users", user.uid), { discoverySettings: next }, { merge: true }).catch(
            () => {}
          );
        }
        return next;
      });
    },
    [user]
  );

  const value = useMemo(() => ({ settings, update, hydrated }), [settings, update, hydrated]);

  return (
    <DiscoverySettingsContext.Provider value={value}>
      {children}
    </DiscoverySettingsContext.Provider>
  );
}

export function useDiscoverySettings() {
  const ctx = useContext(DiscoverySettingsContext);
  if (!ctx) throw new Error("useDiscoverySettings must be used inside <DiscoverySettingsProvider>");
  return ctx;
}

export default useDiscoverySettings;
