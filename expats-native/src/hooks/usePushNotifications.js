import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { httpsCallable } from "firebase/functions";

import { functions, isFirebaseConfigured } from "../config/firebase";
import { theme } from "../config/theme";
import { useAuth } from "./useAuth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function projectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    undefined
  );
}

export async function registerForPush(uid) {
  if (!uid || !isFirebaseConfigured) return null;
  if (!Device.isDevice) return null; // simulators cannot receive push tokens

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Expats",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: theme.colors.primary,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  const id = projectId();
  if (!id || id === "YOUR_EAS_PROJECT_ID") return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  const savePushToken = httpsCallable(functions, "savePushToken");
  await savePushToken({ token, platform: "expo" });
  return token;
}

/** Registers the signed-in user for push and routes notification taps. */
export function usePushNotifications(navigationRef) {
  const { user, onboardingComplete } = useAuth();

  useEffect(() => {
    if (!user || !onboardingComplete) return;
    registerForPush(user.uid).catch(() => {});
  }, [user, onboardingComplete]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data || {};
      const nav = navigationRef?.current;
      if (!nav?.isReady?.()) return;
      if (data.matchId) {
        nav.navigate("Chat", { matchId: data.matchId, otherUid: data.otherUid });
      } else {
        nav.navigate("Tabs", { screen: "Discover" });
      }
    });
    return () => sub.remove();
  }, [navigationRef]);
}

export default usePushNotifications;
