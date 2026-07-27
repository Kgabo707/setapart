import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { theme } from "../config/theme";

export default function GradientButton({
  label,
  onPress,
  disabled,
  loading,
  icon,
  style,
  variant = "gradient",
}) {
  const isOutline = variant === "outline";
  const isSolid = variant === "solid";

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.colors.ink : theme.colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, isOutline && styles.labelOutline]}>{label}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutline && styles.outline,
        isSolid && styles.solid,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {isOutline || isSolid ? (
        content
      ) : (
        <LinearGradient
          colors={theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    borderWidth: 1.5,
    borderColor: theme.colors.white,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
  },
  solid: {
    backgroundColor: theme.colors.ink,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
  },
  labelOutline: {
    color: theme.colors.white,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
