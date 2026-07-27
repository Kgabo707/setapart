import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoadingScreen from "../components/LoadingScreen";
import { theme } from "../config/theme";
import { useAuth } from "../hooks/useAuth";
import { usePushNotifications } from "../hooks/usePushNotifications";
import ChatScreen from "../screens/Chat/ChatScreen";
import VideoCallScreen from "../screens/Chat/VideoCallScreen";
import DiscoverySettings from "../screens/Settings/DiscoverySettings";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: false,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.white,
    text: theme.colors.ink,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
};

export default function AppNavigator({ navigationRef }) {
  const { isSignedIn, onboardingComplete, initializing } = useAuth();
  usePushNotifications(navigationRef);

  if (initializing) return <LoadingScreen message="Getting things ready…" />;

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isSignedIn ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen
              name="VideoCall"
              component={VideoCallScreen}
              options={{ animation: "fade", presentation: "fullScreenModal" }}
            />
            <Stack.Screen name="DiscoverySettings" component={DiscoverySettings} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
