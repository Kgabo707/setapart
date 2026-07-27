import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import type { Settings as PaperSettings } from 'react-native-paper/lib/typescript/core/settings';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { appTheme } from './src/theme';

/**
 * Paper resolves icons through `react-native-vector-icons` by default; pointing it at
 * `@expo/vector-icons` keeps the bundled Expo font in use and avoids a duplicate
 * dependency.
 */
const paperSettings: PaperSettings = {
  icon: ({ name, color, size, testID }) => (
    <MaterialCommunityIcons
      name={name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
      color={color}
      size={size}
      testID={testID}
    />
  ),
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={appTheme} settings={paperSettings}>
          <AuthProvider>
            <View style={[styles.root, { backgroundColor: appTheme.colors.background }]}>
              <StatusBar style="light" />
              <RootNavigator />
            </View>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
