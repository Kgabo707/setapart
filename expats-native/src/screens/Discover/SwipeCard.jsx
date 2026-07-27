import { forwardRef, useImperativeHandle } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { intentLabel } from "../../config/appConfig";
import { theme } from "../../config/theme";
import { formatDistance } from "../../utils/geolocation";
import { displayNameOf, mainPhoto } from "../../utils/profiles";
import TrustRing from "./TrustRing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 120;
const FLY_OUT_DISTANCE = SCREEN_WIDTH * 1.5;
const MAX_ROTATION_DEG = 12;

const SwipeCard = forwardRef(function SwipeCard(
  { profile, distance, showTrust, onSwiped, interactive = true, stackIndex = 0 },
  ref
) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  function flyOut(direction) {
    const action = direction > 0 ? "like" : "pass";
    translateX.value = withTiming(direction * FLY_OUT_DISTANCE, { duration: 260 }, (finished) => {
      if (finished) runOnJS(onSwiped)(action);
    });
  }

  useImperativeHandle(ref, () => ({
    swipeRight: () => flyOut(1),
    swipeLeft: () => flyOut(-1),
  }));

  const pan = Gesture.Pan()
    .enabled(interactive)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        const action = direction > 0 ? "like" : "pass";
        translateX.value = withTiming(
          direction * FLY_OUT_DISTANCE,
          { duration: 220 },
          (finished) => {
            if (finished) runOnJS(onSwiped)(action);
          }
        );
      } else {
        translateX.value = withSpring(0, { damping: 18 });
        translateY.value = withSpring(0, { damping: 18 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-MAX_ROTATION_DEG, 0, MAX_ROTATION_DEG]
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value + stackIndex * 12 },
        { rotate: `${rotate}deg` },
        { scale: 1 - stackIndex * 0.04 },
      ],
    };
  });

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], "clamp"),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], "clamp"),
  }));

  const photo = mainPhoto(profile);
  const intents = (profile.intents || []).slice(0, 3);
  const distanceLabel = formatDistance(distance);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, cardStyle]}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoFallbackText}>{displayNameOf(profile)}</Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(26,26,46,0.15)", "rgba(26,26,46,0.92)"]}
          locations={[0.35, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {showTrust ? (
          <View style={styles.trust} pointerEvents="none">
            <TrustRing profile={profile} />
          </View>
        ) : null}

        <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]} pointerEvents="none">
          <Text style={[styles.stampText, { color: theme.colors.trust }]}>♥ LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeStyle]} pointerEvents="none">
          <Text style={[styles.stampText, { color: theme.colors.primary }]}>✕ NOPE</Text>
        </Animated.View>

        <View style={styles.info} pointerEvents="none">
          <Text style={styles.name}>
            {displayNameOf(profile)}
            {profile.age ? <Text style={styles.age}>, {profile.age}</Text> : null}
          </Text>
          <Text style={styles.meta}>
            {[profile.nationality, profile.city, distanceLabel].filter(Boolean).join(" · ")}
          </Text>
          {profile.job ? <Text style={styles.job}>{profile.job}</Text> : null}
          {profile.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {profile.bio}
            </Text>
          ) : null}
          {intents.length ? (
            <View style={styles.intentRow}>
              {intents.map((intent) => (
                <View key={intent} style={styles.intentPill}>
                  <Text style={styles.intentText}>{intentLabel(intent)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.ink,
    overflow: "hidden",
    shadowColor: theme.colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  photo: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  photoFallback: {
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  photoFallbackText: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.white,
  },
  trust: { position: "absolute", top: theme.spacing.md, right: theme.spacing.md },
  stamp: {
    position: "absolute",
    top: theme.spacing.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  likeStamp: { left: theme.spacing.md, borderColor: theme.colors.trust, transform: [{ rotate: "-12deg" }] },
  nopeStamp: { right: theme.spacing.md, borderColor: theme.colors.primary, transform: [{ rotate: "12deg" }] },
  stampText: { fontFamily: theme.fonts.display, fontSize: 22, letterSpacing: 1 },
  info: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
    gap: 4,
  },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.white,
  },
  age: { fontFamily: theme.fonts.body, fontSize: 24 },
  meta: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: "rgba(255,255,255,0.88)",
  },
  job: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
  },
  bio: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  intentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  intentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
  },
  intentText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    color: theme.colors.white,
  },
});

export default SwipeCard;
