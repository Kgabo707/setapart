import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/common/StateViews';
import type { OrganizationStackScreenProps } from '../../navigation/types';

/** Placeholder — the content management table ships with the dashboard follow-up. */
export const ManageVideosScreen = (_: OrganizationStackScreenProps<'ManageVideos'>) => (
  <View style={styles.root}>
    <EmptyState
      icon="video-outline"
      title="Content management is coming next"
      description="This is where published, pending and rejected uploads will be listed, with per-video review status and analytics."
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
});
