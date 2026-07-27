import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import GradientButton from "../../components/GradientButton";
import { theme } from "../../config/theme";
import { useSocialAuth } from "../../hooks/useSocialAuth";

function SocialButton({ icon, label, onPress, disabled, color = theme.colors.ink }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.socialButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );
}

export default function WelcomeScreen({ navigation }) {
  const { signInWithGoogle, signInWithApple, appleAvailable, busy, error } = useSocialAuth();

  return (
    <LinearGradient
      colors={theme.colors.gradient}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.flex}
    >
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.hero}>
          <Text style={styles.logo}>Expats</Text>
          <Text style={styles.tagline}>Dating for people who left home to find it.</Text>
        </View>

        <View style={styles.actions}>
          <SocialButton
            icon="logo-google"
            label="Continue with Google"
            onPress={signInWithGoogle}
            disabled={busy === "google"}
          />
          {appleAvailable ? (
            <SocialButton
              icon="logo-apple"
              label="Continue with Apple"
              onPress={signInWithApple}
              disabled={busy === "apple"}
            />
          ) : null}
          <GradientButton
            variant="outline"
            label="Continue with email"
            onPress={() => navigation.navigate("SignIn")}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.legal}>
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  logo: {
    fontFamily: theme.fonts.display,
    fontSize: 64,
    color: theme.colors.white,
    letterSpacing: -1.5,
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 18,
    lineHeight: 26,
    color: "rgba(255,255,255,0.9)",
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
  },
  socialLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.white,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  legal: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
});
