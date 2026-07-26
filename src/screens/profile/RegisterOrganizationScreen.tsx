import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Icon, Text, TextInput } from 'react-native-paper';

import { StatusPill } from '../../components/common/StatusPill';
import { useAuth } from '../../context/AuthContext';
import type { RootStackScreenProps } from '../../navigation/types';
import { submitOrganizationApplication } from '../../services/api/organizations';
import { radius, spacing, useAppTheme } from '../../theme';
import { isValidEmail } from '../../utils/format';

const STEPS = [
  {
    icon: 'file-document-edit-outline',
    title: 'Tell us about your ministry',
    body: 'Share who you are, how to reach you and where you are based.',
  },
  {
    icon: 'shield-check-outline',
    title: 'We verify you',
    body: 'A SetApart reviewer confirms your church, ministry or studio is who it says it is.',
  },
  {
    icon: 'upload-outline',
    title: 'Publish',
    body: 'Once approved, organization tools appear in your existing account — no second login.',
  },
];

export const RegisterOrganizationScreen = ({
  navigation,
}: RootStackScreenProps<'RegisterOrganization'>) => {
  const theme = useAppTheme();
  const { user, organization, refresh } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length >= 2 &&
    description.trim().length >= 20 &&
    isValidEmail(contactEmail) &&
    !submitting;

  const onSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitOrganizationApplication(user.id, {
        name: name.trim(),
        description: description.trim(),
        contactEmail: contactEmail.trim(),
        location: location.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
      });
      await refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'We could not submit your application.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // An existing application replaces the form: one organization per owner.
  if (organization) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card
          mode="elevated"
          elevation={1}
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.cardBody}>
            <View
              style={[styles.statusIcon, { backgroundColor: theme.colors.secondaryContainer }]}
            >
              <Icon
                source={
                  organization.verificationStatus === 'verified'
                    ? 'check-decagram'
                    : organization.verificationStatus === 'rejected'
                      ? 'alert-circle-outline'
                      : 'clock-outline'
                }
                size={30}
                color={theme.brand.accent}
              />
            </View>

            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              {organization.name}
            </Text>

            <StatusPill
              label={
                organization.verificationStatus === 'verified'
                  ? 'Verified'
                  : organization.verificationStatus === 'rejected'
                    ? 'Not approved'
                    : 'Under review'
              }
              tone={
                organization.verificationStatus === 'verified'
                  ? 'success'
                  : organization.verificationStatus === 'rejected'
                    ? 'accent'
                    : 'warning'
              }
            />

            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {organization.verificationStatus === 'pending'
                ? `Thank you — your application is with our review team. We will email ${organization.contactEmail} as soon as it is approved, and your organization tools will appear here automatically.`
                : organization.verificationStatus === 'verified'
                  ? 'Your organization is verified. The Organization Dashboard is available from your profile.'
                  : `We were not able to verify this organization. Reply to the email we sent to ${organization.contactEmail} and our team will take another look.`}
            </Text>

            <Button mode="contained" onPress={navigation.goBack} style={styles.button}>
              Back to profile
            </Button>
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={96}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
            Publish on SetApart
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Registering keeps your viewer account exactly as it is — organization tools are added
            alongside it once you are verified.
          </Text>
        </View>

        <Card
          mode="contained"
          style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <View style={styles.steps}>
            {STEPS.map((step, index) => (
              <View key={step.title} style={styles.step}>
                <View style={[styles.stepIcon, { backgroundColor: theme.colors.surface }]}>
                  <Icon source={step.icon} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.stepText}>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                    {index + 1}. {step.title}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card
          mode="elevated"
          elevation={1}
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.cardBody}>
            <TextInput
              mode="outlined"
              label="Organization name"
              value={name}
              onChangeText={setName}
              placeholder="Grace Chapel"
              left={<TextInput.Icon icon="domain" />}
            />

            <TextInput
              mode="outlined"
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              placeholder="Who you are, who you serve and what you plan to publish."
              style={styles.textArea}
            />
            <HelperText type={description.trim().length >= 20 ? 'info' : 'error'} visible>
              {description.trim().length}/20 characters minimum
            </HelperText>

            <TextInput
              mode="outlined"
              label="Contact email"
              value={contactEmail}
              onChangeText={setContactEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              left={<TextInput.Icon icon="email-outline" />}
            />
            <HelperText type="info" visible>
              We use this to reach you about verification and content reviews.
            </HelperText>

            <TextInput
              mode="outlined"
              label="Location (optional)"
              value={location}
              onChangeText={setLocation}
              placeholder="Nashville, TN"
              left={<TextInput.Icon icon="map-marker-outline" />}
            />

            <TextInput
              mode="outlined"
              label="Website (optional)"
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://"
              left={<TextInput.Icon icon="web" />}
              style={styles.spaced}
            />

            <HelperText type="error" visible={Boolean(error)}>
              {error ?? ' '}
            </HelperText>

            <Button
              mode="contained"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={submitting}
              buttonColor={theme.brand.accent}
              textColor={theme.brand.onAccent}
              contentStyle={styles.buttonContent}
              style={styles.button}
            >
              Submit application
            </Button>

            <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.outline }]}>
              Submitting creates a pending organization record. It does not change your account
              roles — the organization role is granted only after a SetApart super-admin approves
              the application.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  intro: { gap: spacing.xs, marginBottom: spacing.lg },
  card: { borderRadius: radius.lg, marginBottom: spacing.lg },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  steps: { padding: spacing.lg, gap: spacing.lg },
  step: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, gap: 2 },
  textArea: { minHeight: 110 },
  spaced: { marginTop: spacing.sm },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  button: { borderRadius: radius.pill, marginTop: spacing.sm },
  buttonContent: { paddingVertical: spacing.xs },
  disclaimer: { marginTop: spacing.sm },
});
