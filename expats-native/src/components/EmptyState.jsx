import { StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

export default function EmptyState({ emoji = "✨", title, message, children, style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emoji: { fontSize: 44 },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.ink,
    textAlign: "center",
  },
  message: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
