import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/common/StateViews';
import type { OrganizationStackScreenProps } from '../../navigation/types';

/**
 * Placeholder — the Mux direct-upload pipeline is explicitly out of scope for this
 * build. Video asset IDs are assumed to already exist in Firestore.
 */
export const UploadVideoScreen = (_: OrganizationStackScreenProps<'UploadVideo'>) => (
  <View style={styles.root}>
    <EmptyState
      icon="cloud-upload-outline"
      title="Uploads are not wired up yet"
      description="The Mux direct-upload flow, metadata form and review submission come with the organization dashboard follow-up."
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
});
