import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/AuthContext';
import { describeAuthError } from '../../services/api/auth';
import { radius, spacing, useAppTheme } from '../../theme';
import type { AuthStackScreenProps } from '../../navigation/types';
import { isValidEmail } from '../../utils/format';

export const SignUpScreen = ({ navigation }: AuthStackScreenProps<'SignUp'>) => {
  const theme = useAppTheme();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    displayName.trim().length >= 2 && isValidEmail(email) && password.length >= 6 && !submitting;

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signUp(displayName, email, password);
    } catch (caught) {
      setError(describeAuthError(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.brand.navy }]} edges={['top']}>
      <Appbar.Header style={{ backgroundColor: theme.brand.navy }} statusBarHeight={0}>
        <Appbar.BackAction color={theme.brand.onNavy} onPress={navigation.goBack} />
        <Appbar.Content title="Create your account" color={theme.brand.onNavy} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Start as a viewer
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.copy, { color: theme.colors.onSurfaceVariant }]}
            >
              Every account begins with viewing access. If you lead a church or ministry, you can
              register your organization later from your profile — no second account needed.
            </Text>

            <TextInput
              mode="outlined"
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              autoComplete="name"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />

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
              autoComplete="new-password"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword((value) => !value)}
                />
              }
              style={styles.input}
            />
            <HelperText type="info" visible={password.length > 0 && password.length < 6}>
              Use at least 6 characters.
            </HelperText>

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
              Create account
            </Button>
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
  card: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  copy: { marginTop: spacing.xs, marginBottom: spacing.lg },
  input: { marginBottom: spacing.sm },
  button: { borderRadius: radius.pill },
  buttonContent: { paddingVertical: spacing.xs },
});
