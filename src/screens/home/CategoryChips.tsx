import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { spacing, useAppTheme } from '../../theme';
import { CATEGORY_ICONS, CATEGORY_LABELS, VIDEO_CATEGORIES, type VideoCategory } from '../../types/models';

export const CategoryChips = ({ onSelect }: { onSelect: (category: VideoCategory) => void }) => {
  const theme = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {VIDEO_CATEGORIES.map((category) => (
        <Chip
          key={category}
          mode="outlined"
          icon={CATEGORY_ICONS[category]}
          onPress={() => onSelect(category)}
          style={[styles.chip, { borderColor: theme.colors.outlineVariant }]}
          textStyle={{ color: theme.colors.primary }}
        >
          {CATEGORY_LABELS[category]}
        </Chip>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  chip: { backgroundColor: 'transparent' },
});
