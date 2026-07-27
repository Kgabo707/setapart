import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { theme } from "../../config/theme";

const DOT_DELAYS = [0, 150, 300];

function Dot({ delay }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: -progress.value * 4 }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export default function TypingIndicator() {
  return (
    <View style={styles.bubble} accessibilityLabel="Typing">
      {DOT_DELAYS.map((delay) => (
        <Dot key={delay} delay={delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.muted,
  },
});
