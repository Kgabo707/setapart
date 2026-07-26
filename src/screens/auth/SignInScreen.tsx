import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandWordmark } from '../../components/common/BrandWordmark';
import { useAuth } from '../../context/AuthContext';
import { describeAuthError } from '../../services/api/auth';
import { radius, spacing, useAppTheme } from '../../theme';
import type { AuthStackScreenProps } from '../../navigation/types';
import { isValidEmail } from '../../utils/format';

export const SignInScreen = ({ navigation }: AuthStackScreenProps<'SignIn'>) => {
  const theme = useAppTheme();
  const { signIn, isDemoMode } = useAuth();

  const [email, setEmail] = useState(isDemoMode ? 'viewer@setapart.app' : '');
  const [password, setPassword] = useState(isDemoMode ? 'setapart' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isValidEmail(email) && password.length >= 6 && !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (caught) {
      setError(describeAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.brand.navy }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <BrandWordmark size="lg" onNavy showTagline />
            <Text variant="bodyLarge" style={[styles.heroCopy, { color: theme.brand.onNavyMuted }]}>
              Sermons, worship, teaching and films from churches and ministries you can trust.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              Welcome back
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.cardCopy, { color: theme.colors.onSurfaceVariant }]}
            >
              Sign in to pick up where you left off.
            </Text>

            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="current-password"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword((value) => !value)}
                />
              }
              style={styles.input}
            />

            <HelperText type="error" visible={Boolean(error)}>
              {error ?? ' '}
            </HelperText>

            <Button
              mode="contained"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={submitting}
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              Sign in
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('SignUp')}
              textColor={theme.brand.accent}
            >
              New here? Create an account
            </Button>

            {isDemoMode ? (
              <View style={[styles.demoNote, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No Firebase project is configured, so the app is running on bundled demo
                  content. Any email and a 6+ character password will sign you in.
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'flex-end' },
  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  heroCopy: { marginTop: spacing.lg, maxWidth: 340 },
  card: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  cardCopy: { marginTop: spacing.xs, marginBottom: spacing.lg },
  input: { marginBottom: spacing.sm },
  button: { borderRadius: radius.pill },
  buttonContent: { paddingVertical: spacing.xs },
  demoNote: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md },
});
