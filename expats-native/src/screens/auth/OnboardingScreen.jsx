import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Chip from "../../components/Chip";
import GradientButton from "../../components/GradientButton";
import { CITIES, INTENTS, PLANS } from "../../config/appConfig";
import { theme } from "../../config/theme";
import { saveOnboardingData, useAuth } from "../../hooks/useAuth";
import { coordsForCity, getDeviceLocation, nearestCity } from "../../utils/geolocation";

const TOTAL_STEPS = 6;

export default function OnboardingScreen() {
  const { user, profile, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState(() => ({
    name: profile?.name || "",
    displayName: profile?.displayName || "",
    gender: profile?.gender || null,
    city: profile?.city || null,
    coords: profile?.coords || null,
    usedDeviceLocation: false,
    intents: profile?.intents || [],
  }));

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // Women get Premium free; men start on Free.
  const assignedPlan = form.gender === "woman" ? PLANS.premium : PLANS.free;

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return form.name.trim().length > 1 && form.displayName.trim().length > 0;
      case 2:
        return Boolean(form.gender);
      case 3:
        return Boolean(form.city);
      case 4:
        return form.intents.length > 0;
      default:
        return true;
    }
  }, [step, form]);

  async function useMyLocation() {
    setError(null);
    setLocating(true);
    try {
      const { latitude, longitude } = await getDeviceLocation();
      const nearest = nearestCity({ latitude, longitude });
      set({
        coords: { lat: latitude, lng: longitude },
        city: nearest?.id || form.city,
        usedDeviceLocation: true,
      });
    } catch (err) {
      setError(
        err.message === "Permission denied"
          ? "Location permission denied — pick your city below instead."
          : "Couldn't get your location. Pick your city below."
      );
    } finally {
      setLocating(false);
    }
  }

  function pickCity(cityId) {
    set({
      city: cityId,
      coords: form.usedDeviceLocation ? form.coords : coordsForCity(cityId),
      usedDeviceLocation: false,
    });
  }

  function toggleIntent(id) {
    set({
      intents: form.intents.includes(id)
        ? form.intents.filter((i) => i !== id)
        : [...form.intents, id],
    });
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      // Writing onboardingComplete fires the onUserOnboarded function, which
      // seeds the first five auto-likes.
      await saveOnboardingData(user.uid, {
        name: form.name.trim(),
        displayName: form.displayName.trim(),
        gender: form.gender,
        city: form.city,
        coords: form.coords || coordsForCity(form.city),
        intents: form.intents,
        plan: assignedPlan.id,
        email: user.email || profile?.email || "",
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function next() {
    if (step === TOTAL_STEPS) finish();
    else setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function back() {
    if (step === 1) signOut();
    else setStep((s) => Math.max(1, s - 1));
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.colors.ink} />
        </Pressable>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={theme.colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]}
          />
        </View>
        <Text style={styles.stepCount}>
          {step}/{TOTAL_STEPS}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <StepShell
              title="What should we call you?"
              subtitle="Your real name stays private. Your display name is what other expats see."
            >
              <Labelled label="Full name (private)">
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(name) =>
                    set({
                      name,
                      displayName: form.displayName || name.split(" ")[0] || "",
                    })
                  }
                  placeholder="Amira Haddad"
                  placeholderTextColor={theme.colors.muted}
                  autoCapitalize="words"
                />
              </Labelled>
              <Labelled label="Display name (public)">
                <TextInput
                  style={styles.input}
                  value={form.displayName}
                  onChangeText={(displayName) => set({ displayName })}
                  placeholder="Amira"
                  placeholderTextColor={theme.colors.muted}
                  autoCapitalize="words"
                />
              </Labelled>
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell title="I am a…" subtitle="This decides who sees you in the deck.">
              <View style={styles.genderRow}>
                {[
                  { id: "woman", label: "Woman", emoji: "👩" },
                  { id: "man", label: "Man", emoji: "👨" },
                ].map((option) => (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: form.gender === option.id }}
                    onPress={() => set({ gender: option.id })}
                    style={[
                      styles.genderCard,
                      form.gender === option.id && styles.genderCardSelected,
                    ]}
                  >
                    <Text style={styles.genderEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.genderLabel,
                        form.gender === option.id && styles.genderLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </StepShell>
          ) : null}

          {step === 3 ? (
            <StepShell
              title="Where are you based?"
              subtitle="We use this to show people near you — you can change it any time."
            >
              <Pressable
                accessibilityRole="button"
                onPress={useMyLocation}
                disabled={locating}
                style={styles.locationButton}
              >
                {locating ? (
                  <ActivityIndicator color={theme.colors.secondary} />
                ) : (
                  <Ionicons name="navigate" size={18} color={theme.colors.secondary} />
                )}
                <Text style={styles.locationButtonLabel}>Use my location</Text>
              </Pressable>
              {form.usedDeviceLocation ? (
                <Text style={styles.hint}>Located you near {cityName(form.city)}.</Text>
              ) : null}
              <Text style={styles.sectionLabel}>Or pick a city</Text>
              <View style={styles.chipWrap}>
                {CITIES.map((city) => (
                  <Chip
                    key={city.id}
                    label={city.label}
                    selected={form.city === city.id}
                    onPress={() => pickCity(city.id)}
                  />
                ))}
              </View>
            </StepShell>
          ) : null}

          {step === 4 ? (
            <StepShell
              title="What are you looking for?"
              subtitle="Pick as many as you like. You can change these later."
            >
              <View style={styles.chipWrap}>
                {INTENTS.map((intent) => (
                  <Chip
                    key={intent.id}
                    label={`${intent.emoji}  ${intent.label}`}
                    selected={form.intents.includes(intent.id)}
                    onPress={() => toggleIntent(intent.id)}
                  />
                ))}
              </View>
            </StepShell>
          ) : null}

          {step === 5 ? (
            <StepShell
              title="Verification keeps this place safe"
              subtitle="Everyone on Expats gets a trust score. Verification is the biggest part of it."
            >
              <InfoCard
                icon="card-outline"
                title={form.gender === "man" ? "ID required" : "ID optional"}
                body={
                  form.gender === "man"
                    ? "Men verify with a government ID before they can message beyond the first reply. It usually takes a few hours."
                    : "Women are fast-tracked: a selfie check is enough, and it's usually approved within minutes."
                }
              />
              <InfoCard
                icon="videocam-outline"
                title="Video check (optional)"
                body="A 5-second video check adds the other half of your verification score and unlocks the verified badge."
              />
              <InfoCard
                icon="shield-checkmark-outline"
                title="What we never share"
                body="Your ID document is never shown to other users. Only the badge and your trust tier are public."
              />
            </StepShell>
          ) : null}

          {step === 6 ? (
            <StepShell
              title={
                assignedPlan.id === "premium"
                  ? "You're on Premium — on us"
                  : "You're starting on Free"
              }
              subtitle={
                assignedPlan.id === "premium"
                  ? "Women get Premium free while we grow the community."
                  : `Free gets you started. Upgrade any time for R${PLANS.premium.priceZar}/mo.`
              }
            >
              <PlanCard plan={assignedPlan} highlighted />
              {assignedPlan.id === "free" ? <PlanCard plan={PLANS.premium} /> : null}
            </StepShell>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <GradientButton
            label={step === TOTAL_STEPS ? "Start swiping" : "Continue"}
            onPress={next}
            disabled={!canContinue}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepShell({ title, subtitle, children }) {
  return (
    <View style={styles.step}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.stepBody}>{children}</View>
    </View>
  );
}

function Labelled({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={22} color={theme.colors.secondary} />
      <View style={styles.infoText}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoBody}>{body}</Text>
      </View>
    </View>
  );
}

function PlanCard({ plan, highlighted }) {
  return (
    <View style={[styles.planCard, highlighted && styles.planCardHighlighted]}>
      <View style={styles.planHeader}>
        <Text style={styles.planLabel}>{plan.label}</Text>
        <Text style={styles.planPrice}>
          {plan.priceZar ? `R${plan.priceZar}/mo` : "Free"}
        </Text>
      </View>
      {plan.perks.map((perk) => (
        <View key={perk} style={styles.perkRow}>
          <Ionicons name="checkmark-circle" size={16} color={theme.colors.trust} />
          <Text style={styles.perkText}>{perk}</Text>
        </View>
      ))}
    </View>
  );
}

function cityName(id) {
  return CITIES.find((c) => c.id === id)?.label || "you";
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.white },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: theme.radius.pill },
  stepCount: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.muted,
  },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  step: { gap: theme.spacing.sm },
  stepBody: { gap: theme.spacing.md, marginTop: theme.spacing.md },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.muted,
  },
  field: { gap: theme.spacing.xs },
  fieldLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.ink,
    backgroundColor: theme.colors.background,
  },
  genderRow: { flexDirection: "row", gap: theme.spacing.md },
  genderCard: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  genderCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "#FDECEE",
  },
  genderEmoji: { fontSize: 48 },
  genderLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  genderLabelSelected: { color: theme.colors.primary },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    paddingVertical: 14,
  },
  locationButtonLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.secondary,
  },
  hint: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.trust,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  infoCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: { flex: 1, gap: 2 },
  infoTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  infoBody: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  planCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.sm,
  },
  planCardHighlighted: {
    borderColor: theme.colors.gold,
    backgroundColor: "#FFFBF0",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planLabel: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.ink,
  },
  planPrice: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
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
    marginTop: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
});
