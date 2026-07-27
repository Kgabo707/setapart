import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { doc, setDoc } from "firebase/firestore";

import Chip from "../../components/Chip";
import SegmentedControl from "../../components/SegmentedControl";
import { AGE_BOUNDS, CITIES, DISTANCE_BOUNDS } from "../../config/appConfig";
import { db, isFirebaseConfigured } from "../../config/firebase";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { useDiscoverySettings } from "../../hooks/useDiscoverySettings";
import { coordsForCity, getDeviceLocation, nearestCity } from "../../utils/geolocation";

const SHOW_ME_OPTIONS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "everyone", label: "Everyone" },
];

export default function DiscoveryPreferences() {
  const { user, profile } = useAuth();
  const { settings, update } = useDiscoverySettings();
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState(null);

  const [minAge, maxAge] = settings.ageRange || [AGE_BOUNDS.min, AGE_BOUNDS.max];

  async function saveLocation(patch) {
    if (!user || !isFirebaseConfigured) return;
    await setDoc(doc(db, "users", user.uid), patch, { merge: true }).catch(() => {});
  }

  async function useCurrentLocation() {
    setLocating(true);
    setLocationNote(null);
    try {
      const { latitude, longitude } = await getDeviceLocation();
      const nearest = nearestCity({ latitude, longitude });
      await saveLocation({ coords: { lat: latitude, lng: longitude }, city: nearest?.id });
      setLocationNote(`Updated — you're near ${CITIES.find((c) => c.id === nearest?.id)?.label}.`);
    } catch (err) {
      setLocationNote(
        err.message === "Permission denied"
          ? "Location permission denied. Pick a city instead."
          : "Couldn't read your location. Pick a city instead."
      );
    } finally {
      setLocating(false);
    }
  }

  async function pickCity(cityId) {
    await saveLocation({ city: cityId, coords: coordsForCity(cityId) });
    setLocationNote(null);
  }

  return (
    <View style={styles.container}>
      <Section title="Location" subtitle="Where you want to meet people.">
        <Pressable
          accessibilityRole="button"
          onPress={useCurrentLocation}
          disabled={locating}
          style={styles.locationButton}
        >
          {locating ? (
            <ActivityIndicator color={theme.colors.secondary} />
          ) : (
            <Ionicons name="navigate" size={18} color={theme.colors.secondary} />
          )}
          <Text style={styles.locationButtonLabel}>Use my current location</Text>
        </Pressable>
        {locationNote ? <Text style={styles.note}>{locationNote}</Text> : null}
        <View style={styles.chipWrap}>
          {CITIES.map((city) => (
            <Chip
              key={city.id}
              label={city.label}
              selected={profile?.city === city.id}
              onPress={() => pickCity(city.id)}
            />
          ))}
        </View>
      </Section>

      <Section title="Show me">
        <SegmentedControl
          options={SHOW_ME_OPTIONS}
          value={settings.showMe}
          onChange={(showMe) => update({ showMe })}
        />
      </Section>

      <Section title="Maximum distance" value={`${settings.maxDistanceKm} km`}>
        <Slider
          minimumValue={DISTANCE_BOUNDS.min}
          maximumValue={DISTANCE_BOUNDS.max}
          step={1}
          value={settings.maxDistanceKm}
          onSlidingComplete={(maxDistanceKm) => update({ maxDistanceKm: Math.round(maxDistanceKm) })}
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.primary}
        />
      </Section>

      <Section title="Age range" value={`${minAge} – ${maxAge}`}>
        <Text style={styles.sliderLabel}>Minimum</Text>
        <Slider
          minimumValue={AGE_BOUNDS.min}
          maximumValue={AGE_BOUNDS.max}
          step={1}
          value={minAge}
          onSlidingComplete={(value) => {
            const next = Math.round(value);
            update({ ageRange: [Math.min(next, maxAge - 1), maxAge] });
          }}
          minimumTrackTintColor={theme.colors.secondary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.secondary}
        />
        <Text style={styles.sliderLabel}>Maximum</Text>
        <Slider
          minimumValue={AGE_BOUNDS.min}
          maximumValue={AGE_BOUNDS.max}
          step={1}
          value={maxAge}
          onSlidingComplete={(value) => {
            const next = Math.round(value);
            update({ ageRange: [minAge, Math.max(next, minAge + 1)] });
          }}
          minimumTrackTintColor={theme.colors.secondary}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.secondary}
        />
      </Section>

      <ToggleRow
        title="Global mode"
        subtitle="See profiles outside your distance radius."
        value={settings.globalMode}
        onChange={(globalMode) => update({ globalMode })}
      />

      <Section title="Chat coach">
        <ToggleRow
          title="Vibe Check"
          subtitle="Scores your draft before you send it, with a coaching tip."
          value={settings.vibeCheckEnabled}
          onChange={(vibeCheckEnabled) => update({ vibeCheckEnabled })}
          bare
        />
      </Section>
    </View>
  );
}

function Section({ title, subtitle, value, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {value ? <Text style={styles.sectionValue}>{value}</Text> : null}
      </View>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function ToggleRow({ title, subtitle, value, onChange, bare }) {
  return (
    <View style={[styles.toggleRow, !bare && styles.section]}>
      <View style={styles.toggleText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.secondary, false: theme.colors.border }}
        thumbColor={theme.colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.md },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  sectionValue: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.primary,
  },
  sectionSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  sliderLabel: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.muted,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
    paddingVertical: 12,
  },
  locationButtonLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  note: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.trust,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  toggleText: { flex: 1, gap: 2 },
});
