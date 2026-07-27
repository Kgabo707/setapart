import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { File } from 'expo-file-system';
import {
  Button,
  Card,
  Chip,
  HelperText,
  Icon,
  ProgressBar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { useAuth } from '../../context/AuthContext';
import type { OrganizationStackScreenProps } from '../../navigation/types';
import { createMuxUpload, uploadFileToMux, waitForMuxAsset } from '../../services/api/muxUpload';
import { submitVideoForReview } from '../../services/api/videos';
import { radius, spacing, useAppTheme } from '../../theme';
import {
  CATEGORY_LABELS,
  VIDEO_CATEGORIES,
  type VideoCategory,
} from '../../types/models';
import { formatDuration } from '../../utils/format';

type UploadStage = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

type MuxResult = { playbackId: string; duration: number };

export const UploadVideoScreen = ({ navigation }: OrganizationStackScreenProps<'UploadVideo'>) => {
  const theme = useAppTheme();
  const { organization, isDemoMode } = useAuth();

  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [muxResult, setMuxResult] = useState<MuxResult | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VideoCategory | null>(null);
  const [speaker, setSpeaker] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const runUpload = useCallback(async (fileUri: string, displayName: string) => {
    setFileName(displayName);
    setUploadStage('uploading');
    setUploadProgress(0);
    setUploadError(null);
    setMuxResult(null);

    try {
      const { uploadId, uploadUrl } = await createMuxUpload();
      await uploadFileToMux(fileUri, uploadUrl, setUploadProgress);
      setUploadStage('processing');

      const result = await waitForMuxAsset(uploadId);
      setMuxResult(result);
      setUploadStage('ready');
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : 'The upload failed.');
      setUploadStage('error');
    }
  }, []);

  const pickAndUpload = useCallback(async () => {
    const picked = await File.pickFileAsync({ mimeTypes: 'video/*' });
    if (picked.canceled) return;
    await runUpload(picked.result.uri, picked.result.name);
  }, [runUpload]);

  const canSubmit =
    uploadStage === 'ready' &&
    Boolean(muxResult) &&
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    Boolean(category) &&
    !submitting;

  const onSubmit = async () => {
    if (!organization || !category || !muxResult) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitVideoForReview(organization.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        videoAssetId: muxResult.playbackId,
        duration: muxResult.duration,
        speaker: speaker.trim() || undefined,
        isLive,
      });
      setDone(true);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : 'We could not submit this video.');
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
        {isDemoMode ? (
          <Card
            mode="contained"
            style={[styles.card, styles.notice, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Demo mode has no Firebase project to upload against — connect one in `.env` to try
              this screen for real.
            </Text>
          </Card>
        ) : null}

        <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardBody}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              1. Upload the file
            </Text>

            {uploadStage === 'idle' ? (
              <Button
                mode="outlined"
                icon="cloud-upload-outline"
                onPress={pickAndUpload}
                style={styles.button}
              >
                Choose video file
              </Button>
            ) : null}

            {uploadStage !== 'idle' ? (
              <UploadStatus
                fileName={fileName}
                stage={uploadStage}
                progress={uploadProgress}
                error={uploadError}
                result={muxResult}
                onRetry={pickAndUpload}
              />
            ) : null}
          </View>
        </Card>

        <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardBody}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              2. Describe it
            </Text>

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
              label="Speaker (optional)"
              value={speaker}
              onChangeText={setSpeaker}
              left={<TextInput.Icon icon="account-voice" />}
              style={styles.spaced}
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

            <HelperText type="error" visible={Boolean(submitError)}>
              {submitError ?? ' '}
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
              New videos always start as pending — they won&apos;t appear to viewers until a
              SetApart reviewer approves them.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const UploadStatus = ({
  fileName,
  stage,
  progress,
  error,
  result,
  onRetry,
}: {
  fileName: string | null;
  stage: UploadStage;
  progress: number;
  error: string | null;
  result: MuxResult | null;
  onRetry: () => void;
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.uploadStatus}>
      {fileName ? (
        <Text variant="bodyMedium" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
          {fileName}
        </Text>
      ) : null}

      {stage === 'uploading' ? (
        <>
          <ProgressBar progress={progress} color={theme.brand.accent} style={styles.progressBar} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Uploading… {Math.round(progress * 100)}%
          </Text>
        </>
      ) : null}

      {stage === 'processing' ? (
        <>
          <ProgressBar indeterminate color={theme.brand.accent} style={styles.progressBar} />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Mux is processing the video — this can take a few minutes for longer files.
          </Text>
        </>
      ) : null}

      {stage === 'ready' && result ? (
        <View style={styles.readyRow}>
          <Icon source="check-circle-outline" size={20} color={theme.brand.verified} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            Ready — {formatDuration(result.duration)} runtime
          </Text>
        </View>
      ) : null}

      {stage === 'error' ? (
        <View style={styles.errorBlock}>
          <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
            {error ?? 'Something went wrong.'}
          </Text>
          <Button mode="outlined" onPress={onRetry} style={styles.retryButton}>
            Try again
          </Button>
        </View>
      ) : null}
    </View>
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
  uploadStatus: { gap: spacing.sm },
  progressBar: { height: 6, borderRadius: radius.pill },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errorBlock: { gap: spacing.sm },
  retryButton: { borderRadius: radius.pill, alignSelf: 'flex-start' },
});
