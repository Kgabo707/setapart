import "react-native-gesture-handler";

import { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { theme } from "./src/config/theme";
import { AuthProvider } from "./src/hooks/useAuth";
import { DiscoverySettingsProvider } from "./src/hooks/useDiscoverySettings";
import AppNavigator from "./src/navigation/AppNavigator";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const navigationRef = useRef(null);
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const onLayout = useCallback(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root} onLayout={onLayout}>
          <StatusBar style="dark" backgroundColor={theme.colors.background} />
          <AuthProvider>
            <DiscoverySettingsProvider>
              <AppNavigator navigationRef={navigationRef} />
            </DiscoverySettingsProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
