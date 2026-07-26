import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Searchbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChips } from '../home/CategoryChips';
import { EmptyState } from '../../components/common/StateViews';
import type { MainTabScreenProps } from '../../navigation/types';
import { radius, spacing, useAppTheme } from '../../theme';

/**
 * Placeholder shell. Query handling, result ranking and filters land in the Search
 * follow-up; the category shortcuts already route into the live published feed.
 */
export const SearchScreen = ({ navigation }: MainTabScreenProps<'Search'>) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.brand.navy }} statusBarHeight={insets.top}>
        <Appbar.Content title="Search" color={theme.brand.onNavy} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Searchbar
          placeholder="Search sermons, worship, ministries"
          value=""
          onChangeText={() => undefined}
          editable={false}
          style={[styles.search, { backgroundColor: theme.colors.surface }]}
          inputStyle={{ color: theme.colors.onSurface }}
        />

        <Text variant="titleMedium" style={[styles.heading, { color: theme.colors.onSurface }]}>
          Browse by category
        </Text>
        <CategoryChips onSelect={(category) => navigation.navigate('CategoryFeed', { category })} />

        <EmptyState
          icon="magnify"
          title="Search is coming next"
          description="Full-text search across titles, tags, speakers and organizations is the next piece of work."
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  search: { marginHorizontal: spacing.lg, borderRadius: radius.pill },
  heading: { paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
});
