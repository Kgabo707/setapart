import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../../config/theme";

export default function VibeBar({ vibe, scoring }) {
  if (!vibe && !scoring) return null;

  if (!vibe) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.colors.muted} />
        <Text style={styles.checking}>Checking the vibe…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderLeftColor: vibe.color }]}>
      <View style={styles.header}>
        <Text style={[styles.score, { color: vibe.color }]}>{vibe.score}</Text>
        <Text style={styles.label}>{vibe.label}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${vibe.score}%`, backgroundColor: vibe.color }]}
        />
      </View>
      {vibe.tip ? <Text style={styles.tip}>{vibe.tip}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: 6,
    flexDirection: "column",
  },
  header: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  score: { fontFamily: theme.fonts.display, fontSize: 16 },
  label: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.ink },
  checking: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.muted },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 2 },
  tip: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: theme.colors.muted,
  },
});
