import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, HelperText, Switch, Text, TextInput } from 'react-native-paper';

import { useAuth } from '../../context/AuthContext';
import type { OrganizationStackScreenProps } from '../../navigation/types';
import { submitVideoForReview } from '../../services/api/videos';
import { radius, spacing, useAppTheme } from '../../theme';
import {
  CATEGORY_LABELS,
  VIDEO_CATEGORIES,
  type VideoCategory,
} from '../../types/models';

/** `12:34` or `1:02:03` → seconds. Returns null if the format doesn't parse. */
const parseDuration = (value: string): number | null => {
  const parts = value.trim().split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const numbers = parts.map(Number);
  const [h, m, s] = numbers.length === 3 ? numbers : [0, numbers[0], numbers[1]];
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
};

export const UploadVideoScreen = ({ navigation }: OrganizationStackScreenProps<'UploadVideo'>) => {
  const theme = useAppTheme();
  const { organization } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VideoCategory | null>(null);
  const [videoAssetId, setVideoAssetId] = useState('');
  const [durationText, setDurationText] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const duration = parseDuration(durationText);

  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    Boolean(category) &&
    videoAssetId.trim().length > 0 &&
    duration !== null &&
    !submitting;

  const onSubmit = async () => {
    if (!organization || !category || duration === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitVideoForReview(organization.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        videoAssetId: videoAssetId.trim(),
        duration,
        speaker: speaker.trim() || undefined,
        isLive,
      });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not submit this video.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardBody}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
              Submitted for review
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              &ldquo;{title.trim()}&rdquo; is now in your content list as pending. It will appear to
              viewers once it&apos;s approved.
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.replace('ManageVideos')}
              buttonColor={theme.brand.accent}
              textColor={theme.brand.onAccent}
              style={styles.button}
            >
              View your content
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
        <Card
          mode="contained"
          style={[styles.card, styles.notice, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Upload the file to Mux first (Mux dashboard, or your own upload tool) and paste the
            playback ID it gives you below. Direct in-app upload isn&apos;t wired up yet.
          </Text>
        </Card>

        <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardBody}>
            <TextInput
              mode="outlined"
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Sunday sermon: Walking in faith"
              left={<TextInput.Icon icon="format-title" />}
            />

            <TextInput
              mode="outlined"
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
            <HelperText type={description.trim().length >= 10 ? 'info' : 'error'} visible>
              {description.trim().length}/10 characters minimum
            </HelperText>

            <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
              Category
            </Text>
            <View style={styles.chipWrap}>
              {VIDEO_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  mode={category === cat ? 'flat' : 'outlined'}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    category === cat
                      ? { backgroundColor: theme.brand.navy }
                      : { borderColor: theme.colors.outlineVariant },
                  ]}
                  textStyle={{ color: category === cat ? theme.brand.onNavy : theme.colors.primary }}
                >
                  {CATEGORY_LABELS[cat]}
                </Chip>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Mux playback ID"
              value={videoAssetId}
              onChangeText={setVideoAssetId}
              autoCapitalize="none"
              placeholder="e.g. sB1xxxxxx02V"
              left={<TextInput.Icon icon="movie-outline" />}
              style={styles.spaced}
            />

            <TextInput
              mode="outlined"
              label="Duration (mm:ss or hh:mm:ss)"
              value={durationText}
              onChangeText={setDurationText}
              placeholder="42:15"
              left={<TextInput.Icon icon="clock-outline" />}
              style={styles.spaced}
            />
            <HelperText type={durationText.length === 0 || duration !== null ? 'info' : 'error'} visible>
              {durationText.length === 0
                ? 'Used to show run time before playback.'
                : duration !== null
                  ? 'Looks good.'
                  : 'Use mm:ss or hh:mm:ss.'}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Speaker (optional)"
              value={speaker}
              onChangeText={setSpeaker}
              left={<TextInput.Icon icon="account-voice" />}
            />

            <TextInput
              mode="outlined"
              label="Tags (comma separated, optional)"
              value={tagsText}
              onChangeText={setTagsText}
              placeholder="faith, healing, family"
              left={<TextInput.Icon icon="tag-outline" />}
              style={styles.spaced}
            />

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  This is a live stream
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Shows a LIVE badge once published
                </Text>
              </View>
              <Switch value={isLive} onValueChange={setIsLive} color={theme.brand.accent} />
            </View>

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
              Submit for review
            </Button>

            <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.outline }]}>
              New videos always start as pending — they won&apos;t appear to viewers until a SetApart
              reviewer approves them.
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
  card: { borderRadius: radius.lg, marginBottom: spacing.lg },
  notice: { padding: spacing.md },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  textArea: { minHeight: 90 },
  label: { marginTop: spacing.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { borderRadius: radius.pill },
  spaced: { marginTop: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  switchText: { flex: 1, gap: 2, paddingRight: spacing.md },
  button: { borderRadius: radius.pill, marginTop: spacing.sm },
  buttonContent: { paddingVertical: spacing.xs },
  disclaimer: { marginTop: spacing.sm },
});
