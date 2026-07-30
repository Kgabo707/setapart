import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { EmptyState, LoadingState } from '../../components/common/StateViews';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { ModerationStackScreenProps } from '../../navigation/types';
import { listOpenReports, resolveReport } from '../../services/api/reports';
import { setVideoPublishStatus } from '../../services/api/videos';
import { radius, spacing, useAppTheme } from '../../theme';
import { REPORT_REASON_LABELS, type Report } from '../../types/models';
import { formatRelativeDate } from '../../utils/format';

/**
 * The viewer-facing counterpart to the upload review queue: someone flagged an
 * already-published video. Resolving a report and unpublishing the video it points at
 * are deliberately separate actions — a report can be resolved as "not an issue"
 * without touching the video, or the video can be pulled without dismissing the report.
 */
export const ReportedContentScreen = (_: ModerationStackScreenProps<'ReportedContent'>) => {
  const loadReports = useCallback(() => listOpenReports(200), []);
  const { data, loading, refreshing, refresh } = useAsyncData(loadReports);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const onResolve = async (reportId: string) => {
    setActingOn(reportId);
    try {
      await resolveReport(reportId);
      await refresh();
    } finally {
      setActingOn(null);
    }
  };

  const onUnpublish = async (report: Report) => {
    setActingOn(report.id);
    try {
      await setVideoPublishStatus(report.videoId, 'rejected');
      await resolveReport(report.id);
      await refresh();
    } finally {
      setActingOn(null);
    }
  };

  if (loading && !data) return <LoadingState label="Loading reports…" />;

  return (
    <FlatList
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshing={refreshing}
      onRefresh={refresh}
      ListEmptyComponent={
        <EmptyState
          icon="flag-outline"
          title="No open reports"
          description="Reports viewers submit on videos will show up here."
        />
      }
      renderItem={({ item }) => (
        <ReportCard
          report={item}
          busy={actingOn === item.id}
          onResolve={() => onResolve(item.id)}
          onUnpublish={() => onUnpublish(item)}
        />
      )}
    />
  );
};

const ReportCard = ({
  report,
  busy,
  onResolve,
  onUnpublish,
}: {
  report: Report;
  busy: boolean;
  onResolve: () => void;
  onUnpublish: () => void;
}) => {
  const theme = useAppTheme();

  return (
    <Card mode="elevated" elevation={1} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardBody}>
        <Text variant="titleSmall" numberOfLines={2} style={{ color: theme.colors.onSurface }}>
          {report.videoTitle}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {REPORT_REASON_LABELS[report.reason]} · {formatRelativeDate(report.createdAt)}
        </Text>
        {report.details ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            &ldquo;{report.details}&rdquo;
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onResolve}
            disabled={busy}
            style={styles.actionButton}
          >
            Dismiss
          </Button>
          <Button
            mode="contained"
            onPress={onUnpublish}
            loading={busy}
            disabled={busy}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            style={styles.actionButton}
          >
            Unpublish video
          </Button>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md },
  cardBody: { padding: spacing.lg, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { flex: 1, borderRadius: radius.pill },
});
