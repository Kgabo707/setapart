import { Image, StyleSheet, Text, View } from "react-native";

import { theme } from "../config/theme";
import { initialsOf } from "../utils/format";

export default function Avatar({ uri, name, size = 48, style }) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimension, style]} />;
  }
  return (
    <View style={[styles.fallback, dimension, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: theme.colors.border },
  fallback: {
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bodyBold,
  },
});
