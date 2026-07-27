import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import Avatar from "../../components/Avatar";
import GradientButton from "../../components/GradientButton";
import ScreenHeader from "../../components/ScreenHeader";
import { FREE_SWIPES_PER_DAY, PLANS, TRAVEL_MODE } from "../../config/appConfig";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { usePlan } from "../../hooks/usePlan";
import { fetchProfile } from "../../hooks/useProfiles";
import { getLikedByUids } from "../../utils/matching";
import { openPayfastCheckout } from "../../utils/payfast";
import { displayNameOf, mainPhoto } from "../../utils/profiles";
import { getSwipeCount } from "../../utils/swipeLimit";

export default function AccountScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { plan, isPremium, loading: planLoading, refresh } = usePlan();
  const [swipeCount, setSwipeCount] = useState(0);
  const [admirers, setAdmirers] = useState([]);
  const [checkoutError, setCheckoutError] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (user?.uid) getSwipeCount(user.uid).then(setSwipeCount);
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) return undefined;
    getLikedByUids(user.uid)
      .then((uids) => Promise.all(uids.slice(0, 12).map((uid) => fetchProfile(uid).catch(() => null))))
      .then((results) => {
        if (!cancelled) setAdmirers(results.filter(Boolean));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const checkout = useCallback(
    async ({ amount, itemName, key }) => {
      setCheckoutError(null);
      setBusy(key);
      try {
        await openPayfastCheckout({ amount, itemName, uid: user.uid });
        // The plan flips once the payfastITN webhook writes it to Firestore.
        await refresh();
      } catch (err) {
        setCheckoutError(err.message);
      } finally {
        setBusy(null);
      }
    },
    [user?.uid, refresh]
  );

  const used = Math.min(swipeCount, FREE_SWIPES_PER_DAY);
  const usageRatio = used / FREE_SWIPES_PER_DAY;

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ScreenHeader title="Account" subtitle={profile?.displayName || undefined} />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={isPremium ? [theme.colors.gold, "#E2C46A"] : theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCard}
        >
          <Text style={styles.planLabel}>Current plan</Text>
          <Text style={styles.planName}>
            {planLoading ? "…" : isPremium ? PLANS.premium.label : PLANS.free.label}
          </Text>
          <Text style={styles.planBlurb}>
            {isPremium
              ? "Unlimited swipes, trust scores, and everyone who liked you."
              : `${FREE_SWIPES_PER_DAY} swipes a day and unlimited chat with your matches.`}
          </Text>
        </LinearGradient>

        {!isPremium ? (
          <View style={styles.card}>
            <View style={styles.usageHeader}>
              <Text style={styles.cardTitle}>Swipes today</Text>
              <Text style={styles.usageCount}>
                {used} / {FREE_SWIPES_PER_DAY}
              </Text>
            </View>
            <View style={styles.usageTrack}>
              <LinearGradient
                colors={theme.colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.usageFill, { width: `${Math.min(100, usageRatio * 100)}%` }]}
              />
            </View>
            <Text style={styles.cardSubtitle}>Your swipes reset at midnight.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.usageHeader}>
            <Text style={styles.cardTitle}>Who liked you</Text>
            <Text style={styles.badge}>{admirers.length}</Text>
          </View>
          {admirers.length === 0 ? (
            <Text style={styles.cardSubtitle}>
              Nobody yet — keep swiping and they&apos;ll show up here.
            </Text>
          ) : (
            <View style={styles.admirerGrid}>
              {admirers.map((admirer) => (
                <View key={admirer.uid} style={styles.admirerTile}>
                  {mainPhoto(admirer) ? (
                    <Image source={{ uri: mainPhoto(admirer) }} style={styles.admirerPhoto} />
                  ) : (
                    <Avatar name={displayNameOf(admirer)} size={86} />
                  )}
                  {!isPremium ? (
                    <BlurView intensity={38} tint="light" style={StyleSheet.absoluteFill}>
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={16} color={theme.colors.white} />
                      </View>
                    </BlurView>
                  ) : (
                    <View style={styles.admirerNameWrap}>
                      <Text style={styles.admirerName} numberOfLines={1}>
                        {displayNameOf(admirer)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          {!isPremium && admirers.length > 0 ? (
            <Text style={styles.cardSubtitle}>
              Premium reveals every name and photo — and lets you match instantly.
            </Text>
          ) : null}
        </View>

        {!isPremium ? (
          <View style={[styles.card, styles.upgradeCard]}>
            <Text style={styles.upgradeTitle}>Expats Premium</Text>
            <Text style={styles.upgradePrice}>R{PLANS.premium.priceZar}/mo</Text>
            {PLANS.premium.perks.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.trust} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
            <GradientButton
              label="Upgrade with PayFast"
              loading={busy === "premium"}
              onPress={() =>
                checkout({
                  amount: PLANS.premium.priceZar,
                  itemName: "Expats Premium",
                  key: "premium",
                })
              }
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.usageHeader}>
            <Text style={styles.cardTitle}>{TRAVEL_MODE.label}</Text>
            <Text style={styles.addOnPrice}>R{TRAVEL_MODE.priceZar}/mo</Text>
          </View>
          <Text style={styles.cardSubtitle}>{TRAVEL_MODE.description}</Text>
          <GradientButton
            variant="solid"
            label="Add Travel Mode"
            loading={busy === "travel"}
            onPress={() =>
              checkout({
                amount: TRAVEL_MODE.priceZar,
                itemName: "Expats Travel Mode",
                key: "travel",
              })
            }
          />
        </View>

        {checkoutError ? <Text style={styles.error}>{checkoutError}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("Settings")}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Discovery settings</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
        </Pressable>

        <Text style={styles.planFooter}>
          Plan: {plan}
          {profile?.planExpiry ? ` · renews ${String(profile.planExpiry).slice(0, 10)}` : ""}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  planCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: 4,
  },
  planLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  planName: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.white,
  },
  planBlurb: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.9)",
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  upgradeCard: { borderColor: theme.colors.gold, backgroundColor: "#FFFCF4" },
  cardTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  cardSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  usageCount: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  usageTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  usageFill: { height: "100%", borderRadius: 4 },
  badge: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.white,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    overflow: "hidden",
  },
  admirerGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  admirerTile: {
    width: "31%",
    aspectRatio: 0.85,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.background,
  },
  admirerPhoto: { width: "100%", height: "100%" },
  lockOverlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  admirerNameWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(26,26,46,0.6)",
  },
  admirerName: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 11,
    color: theme.colors.white,
  },
  upgradeTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.ink,
  },
  upgradePrice: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.gold,
  },
  addOnPrice: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.gold,
  },
  perkRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  perkText: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
  },
  error: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.primary,
    textAlign: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  linkText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 15,
    color: theme.colors.ink,
  },
  planFooter: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
