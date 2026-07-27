import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenHeader from "../../components/ScreenHeader";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import DiscoveryPreferences from "./DiscoveryPreferences";

export default function SettingsScreen() {
  const { signOut, profile, user } = useAuth();

  function confirmSignOut() {
    Alert.alert("Sign out", "You'll need to sign in again to keep chatting.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ScreenHeader title="Settings" subtitle={profile?.email || user?.email || undefined} />
      <ScrollView contentContainerStyle={styles.content}>
        <DiscoveryPreferences />

        <Pressable accessibilityRole="button" onPress={confirmSignOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Expats v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  signOut: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    alignItems: "center",
  },
  signOutText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.primary,
  },
  footer: { alignItems: "center", paddingVertical: theme.spacing.md },
  footerText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
});
