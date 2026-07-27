import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";

export default function LoadingScreen({ message }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    gap: theme.spacing.md,
  },
  message: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.muted,
  },
});
