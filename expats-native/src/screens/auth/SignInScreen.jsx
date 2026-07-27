import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientButton from "../../components/GradientButton";
import ScreenHeader from "../../components/ScreenHeader";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";

const FRIENDLY_ERRORS = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "No account with that email yet.",
  "auth/email-already-in-use": "That email is already registered — sign in instead.",
  "auth/weak-password": "Passwords need at least 6 characters.",
  "auth/network-request-failed": "Network problem. Check your connection and try again.",
};

export default function SignInScreen({ navigation }) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === "signup";

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      // AppNavigator swaps to onboarding or the tabs once auth state settles.
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <ScreenHeader
        title={isSignUp ? "Create account" : "Welcome back"}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isSignUp ? (
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.colors.muted}
                autoCapitalize="words"
                textContentType="name"
              />
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry
              textContentType={isSignUp ? "newPassword" : "password"}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <GradientButton
            label={isSignUp ? "Create account" : "Sign in"}
            onPress={submit}
            loading={submitting}
            style={styles.submit}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(isSignUp ? "signin" : "signup");
              setError(null);
            }}
          >
            <Text style={styles.switchMode}>
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.white },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  field: { gap: theme.spacing.xs },
  label: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.ink,
    backgroundColor: theme.colors.background,
  },
  error: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.primary,
  },
  submit: { marginTop: theme.spacing.sm },
  switchMode: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
});
