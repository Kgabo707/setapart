import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import GradientButton from "../../components/GradientButton";
import LoadingScreen from "../../components/LoadingScreen";
import { FREE_SWIPES_PER_DAY, INTENTS } from "../../config/appConfig";
import { isFirebaseConfigured } from "../../config/firebase";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { useDiscoverySettings } from "../../hooks/useDiscoverySettings";
import { usePlan } from "../../hooks/usePlan";
import { useProfiles } from "../../hooks/useProfiles";
import { useSwipedUids } from "../../hooks/useSwipedUids";
import { distanceKm, normalizeCoords } from "../../utils/geolocation";
import { matchIdFor, recordSwipe } from "../../utils/matching";
import { matchesShowMe } from "../../utils/profiles";
import { getSwipeCount, incrementSwipeCount } from "../../utils/swipeLimit";
import MatchModal from "./MatchModal";
import SwipeCard from "./SwipeCard";

const VISIBLE_CARDS = 3;

export default function DiscoverScreen({ navigation }) {
  const { user, profile: me } = useAuth();
  const { settings, update } = useDiscoverySettings();
  const { isPremium } = usePlan();
  const { profiles, loading: loadingProfiles, reload } = useProfiles();
  const { swipedUids, loading: loadingSwipes, markSwiped } = useSwipedUids(user?.uid);

  const [cursor, setCursor] = useState(0);
  const [swipeCount, setSwipeCount] = useState(0);
  const [match, setMatch] = useState(null);
  const topCardRef = useRef(null);

  useEffect(() => {
    if (user?.uid) getSwipeCount(user.uid).then(setSwipeCount);
  }, [user?.uid]);

  const myCoords = normalizeCoords(me?.coords);
  // Trust scores are shown to women by default.
  const showTrust = me?.gender === "woman";

  const deck = useMemo(() => {
    const [minAge, maxAge] = settings.ageRange || [18, 65];
    return profiles
      .filter((p) => p.uid !== user?.uid)
      .filter((p) => !swipedUids.has(p.uid))
      .filter((p) => matchesShowMe(p, settings.showMe))
      .filter((p) => {
        if (!p.age) return true;
        return p.age >= minAge && p.age <= maxAge;
      })
      .filter((p) => {
        if (!settings.intents?.length) return true;
        return (p.intents || []).some((intent) => settings.intents.includes(intent));
      })
      .map((p) => {
        const theirCoords = normalizeCoords(p.coords);
        const distance =
          myCoords && theirCoords ? distanceKm(myCoords, theirCoords) : null;
        return { ...p, distance };
      })
      .filter((p) => {
        if (settings.globalMode) return true;
        if (p.distance == null) return true;
        return p.distance <= (settings.maxDistanceKm || 160);
      })
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [profiles, swipedUids, settings, user?.uid, myCoords]);

  const visible = deck.slice(cursor, cursor + VISIBLE_CARDS);
  const outOfSwipes = !isPremium && swipeCount >= FREE_SWIPES_PER_DAY;
  const remaining = isPremium ? null : Math.max(0, FREE_SWIPES_PER_DAY - swipeCount);

  const handleSwiped = useCallback(
    async (target, action) => {
      setCursor((c) => c + 1);
      markSwiped(target.uid);
      if (!user) return;

      Haptics.impactAsync(
        action === "like"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});

      const nextCount = await incrementSwipeCount(user.uid);
      setSwipeCount(nextCount);

      try {
        const result = await recordSwipe({
          swiperUid: user.uid,
          targetUid: target.uid,
          action,
        });
        if (result.matched) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setMatch({ profile: target, matchId: result.matchId || matchIdFor(user.uid, target.uid) });
        }
      } catch {
        // Swipe is best-effort; the card has already left the deck.
      }
    },
    [user, markSwiped]
  );

  function toggleIntentFilter(id) {
    const current = settings.intents || [];
    update({
      intents: current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    });
    setCursor(0);
  }

  function openChat() {
    if (!match) return;
    const target = match.profile;
    setMatch(null);
    navigation.navigate("Chat", {
      matchId: match.matchId,
      otherUid: target.uid,
      otherProfile: target,
    });
  }

  if (!isFirebaseConfigured) {
    return (
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <EmptyState
          emoji="🔌"
          title="Firebase isn't configured"
          message="Copy .env.example to .env and fill in the primi-signals credentials, then restart the dev server."
        />
      </SafeAreaView>
    );
  }

  if (loadingProfiles || loadingSwipes) return <LoadingScreen message="Finding expats near you…" />;

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.logo}>Expats</Text>
        <View style={styles.headerRight}>
          {remaining != null ? (
            <Text style={styles.remaining}>{remaining} left today</Text>
          ) : (
            <Text style={styles.unlimited}>Unlimited</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Discovery settings"
            onPress={() => navigation.navigate("DiscoverySettings")}
            hitSlop={10}
          >
            <Ionicons name="options-outline" size={22} color={theme.colors.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersRow}
      >
        <Chip
          label="All"
          selected={!settings.intents?.length}
          onPress={() => {
            update({ intents: [] });
            setCursor(0);
          }}
        />
        {INTENTS.map((intent) => (
          <Chip
            key={intent.id}
            label={`${intent.emoji} ${intent.label}`}
            selected={settings.intents?.includes(intent.id)}
            onPress={() => toggleIntentFilter(intent.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.deck}>
        {outOfSwipes ? (
          <View style={styles.limitCard}>
            <Text style={styles.limitEmoji}>🔥</Text>
            <Text style={styles.limitTitle}>Out of swipes</Text>
            <Text style={styles.limitBody}>
              You&apos;ve used all {FREE_SWIPES_PER_DAY} free swipes today. Premium gets you
              unlimited swipes and shows you everyone who already liked you.
            </Text>
            <GradientButton
              label="Upgrade to Premium"
              onPress={() => navigation.navigate("Tabs", { screen: "Account" })}
            />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            emoji="🌍"
            title="That's everyone for now"
            message="Widen your distance or age range in settings, or check back later — new expats join every day."
          >
            <View style={styles.emptyActions}>
              <GradientButton
                variant="solid"
                label="Adjust filters"
                onPress={() => navigation.navigate("DiscoverySettings")}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setCursor(0);
                  reload();
                }}
              >
                <Text style={styles.refresh}>Refresh deck</Text>
              </Pressable>
            </View>
          </EmptyState>
        ) : (
          visible
            .map((item, index) => (
              <SwipeCard
                key={item.uid}
                ref={index === 0 ? topCardRef : undefined}
                profile={item}
                distance={item.distance}
                showTrust={showTrust}
                interactive={index === 0}
                stackIndex={index}
                onSwiped={(action) => handleSwiped(item, action)}
              />
            ))
            // Render back-to-front so the top card sits above the stack.
            .reverse()
        )}
      </View>

      {!outOfSwipes && visible.length > 0 ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pass"
            onPress={() => topCardRef.current?.swipeLeft()}
            style={[styles.actionButton, styles.passButton]}
          >
            <Ionicons name="close" size={30} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Like"
            onPress={() => topCardRef.current?.swipeRight()}
            style={[styles.actionButton, styles.likeButton]}
          >
            <Ionicons name="heart" size={28} color={theme.colors.white} />
          </Pressable>
        </View>
      ) : null}

      <MatchModal
        visible={Boolean(match)}
        matchedProfile={match?.profile}
        myProfile={me}
        onKeepSwiping={() => setMatch(null)}
        onChat={openChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  logo: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.primary,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  remaining: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.muted,
  },
  unlimited: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.gold,
  },
  filtersRow: { flexGrow: 0 },
  filters: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  deck: {
    flex: 1,
    margin: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  actionButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  passButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  likeButton: { backgroundColor: theme.colors.primary },
  limitCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  limitEmoji: { fontSize: 48 },
  limitTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.ink,
  },
  limitBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
    textAlign: "center",
  },
  emptyActions: { gap: theme.spacing.sm, marginTop: theme.spacing.md, alignSelf: "stretch" },
  refresh: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: "center",
  },
});
