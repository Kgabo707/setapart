import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../config/theme";

export default function ScreenHeader({ title, subtitle, onBack, right, style }) {
  return (
    <View style={[styles.header, style]}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.ink} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  titles: { flex: 1 },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.ink,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
  },
});
