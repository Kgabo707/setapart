import { Pressable, StyleSheet, Text } from "react-native";

import { theme } from "../config/theme";

export default function Chip({ label, selected, onPress, style, compact }) {
  const Container = onPress ? Pressable : Text;
  if (!onPress) {
    return (
      <Text style={[styles.chip, compact && styles.compact, styles.text, style]}>{label}</Text>
    );
  }
  return (
    <Container
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.compact,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  compact: { paddingHorizontal: 10, paddingVertical: 5 },
  selected: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  pressed: { opacity: 0.75 },
  text: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.ink,
  },
  textSelected: { color: theme.colors.white },
});
