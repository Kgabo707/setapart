import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

export default function SegmentedControl({ options, value, onChange, style }) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: theme.radius.pill,
  },
  segmentSelected: { backgroundColor: theme.colors.ink },
  label: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.muted,
  },
  labelSelected: { color: theme.colors.white },
});
