import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { theme } from "../../config/theme";
import { computeTrustScore } from "../../utils/trustScore";

export default function TrustRing({ profile, size = 52, strokeWidth = 4, showLabel = true }) {
  const { score, tier, hasEnoughData } = computeTrustScore(profile);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = hasEnoughData ? Math.min(100, Math.max(0, score)) / 100 : 0;
  const center = size / 2;

  return (
    <View style={styles.container}>
      <View style={[styles.ring, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={strokeWidth}
            fill="rgba(26,26,46,0.45)"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={tier.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference * progress} ${circumference}`}
            // Start the arc at 12 o'clock instead of 3 o'clock.
            transform={`rotate(-90 ${center} ${center})`}
            fill="none"
          />
        </Svg>
        <View style={styles.scoreWrap} pointerEvents="none">
          <Text style={[styles.score, { fontSize: size * 0.3 }]}>
            {hasEnoughData ? score : "—"}
          </Text>
        </View>
      </View>
      {showLabel ? (
        <View style={[styles.badge, { backgroundColor: tier.color }]}>
          <Text style={styles.badgeText}>{hasEnoughData ? tier.label : "New here"}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 6 },
  ring: { alignItems: "center", justifyContent: "center" },
  scoreWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  score: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.white,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.ink,
  },
});
