import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { doc, setDoc } from "firebase/firestore";

import Chip from "../../components/Chip";
import GradientButton from "../../components/GradientButton";
import ScreenHeader from "../../components/ScreenHeader";
import { INTENTS, MAX_PROFILE_PHOTOS } from "../../config/appConfig";
import { db } from "../../config/firebase";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { uploadProfilePhoto } from "../../utils/media";
import { galleryPhotos } from "../../utils/profiles";

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState("");
  const [intents, setIntents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setPhotos(galleryPhotos(profile));
    setBio(profile.bio || "");
    setLanguages((profile.languages || []).join(", "));
    setIntents(profile.intents || []);
  }, [profile]);

  const dirty = useMemo(() => {
    if (!profile) return false;
    const sameLanguages =
      (profile.languages || []).join(", ") === languages.trim() ||
      (!profile.languages?.length && !languages.trim());
    return (
      (profile.bio || "") !== bio ||
      !sameLanguages ||
      JSON.stringify(profile.intents || []) !== JSON.stringify(intents)
    );
  }, [profile, bio, languages, intents]);

  async function persistPhotos(next) {
    setPhotos(next);
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid),
      { photos: { main: next[0] || null, gallery: next.slice(1) } },
      { merge: true }
    ).catch(() => setStatus("Couldn't save your photos. Try again."));
  }

  async function addPhoto() {
    if (photos.length >= MAX_PROFILE_PHOTOS) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus("Photo library access is needed to upload a picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    setStatus(null);
    try {
      const url = await uploadProfilePhoto(user.uid, result.assets[0].uri);
      await persistPhotos([...photos, url]);
    } catch {
      setStatus("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function makeMain(index) {
    if (index === 0) return;
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    persistPhotos([picked, ...next]);
  }

  function removePhoto(index) {
    Alert.alert("Remove photo", "This photo will no longer show on your profile.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => persistPhotos(photos.filter((_, i) => i !== index)),
      },
    ]);
  }

  function toggleIntent(id) {
    setIntents((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    setStatus(null);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          bio: bio.trim(),
          languages: languages
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
          intents,
        },
        { merge: true }
      );
      setStatus("Profile saved.");
    } catch {
      setStatus("Couldn't save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <ScreenHeader title="Your profile" subtitle={profile?.displayName || undefined} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Photos</Text>
            <Text style={styles.cardSubtitle}>
              Tap a photo to make it your main one. Long press to remove.
            </Text>
            <View style={styles.grid}>
              {photos.map((uri, index) => (
                <Pressable
                  key={uri}
                  accessibilityRole="button"
                  accessibilityLabel={index === 0 ? "Main photo" : `Photo ${index + 1}`}
                  onPress={() => makeMain(index)}
                  onLongPress={() => removePhoto(index)}
                  style={styles.photoWrap}
                >
                  <Image source={{ uri }} style={styles.photo} />
                  {index === 0 ? (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
              {photos.length < MAX_PROFILE_PHOTOS ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add photo"
                  onPress={addPhoto}
                  disabled={uploading}
                  style={[styles.photoWrap, styles.addPhoto]}
                >
                  {uploading ? (
                    <ActivityIndicator color={theme.colors.secondary} />
                  ) : (
                    <Ionicons name="add" size={28} color={theme.colors.muted} />
                  )}
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Three countries, two languages, one very confused cat."
              placeholderTextColor={theme.colors.muted}
              multiline
              maxLength={400}
            />
            <Text style={styles.counter}>{bio.length}/400</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Languages</Text>
            <TextInput
              style={styles.input}
              value={languages}
              onChangeText={setLanguages}
              placeholder="English, Arabic, Portuguese"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Looking for</Text>
            <View style={styles.chipWrap}>
              {INTENTS.map((intent) => (
                <Chip
                  key={intent.id}
                  label={`${intent.emoji}  ${intent.label}`}
                  selected={intents.includes(intent.id)}
                  onPress={() => toggleIntent(intent.id)}
                />
              ))}
            </View>
          </View>

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <GradientButton
            label="Save profile"
            onPress={save}
            loading={saving}
            disabled={!dirty}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  cardSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  photoWrap: {
    width: "31%",
    aspectRatio: 0.78,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.background,
  },
  photo: { width: "100%", height: "100%" },
  addPhoto: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.border,
  },
  mainBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.gold,
  },
  mainBadgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
    backgroundColor: theme.colors.background,
  },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  counter: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    alignSelf: "flex-end",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  status: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.secondary,
    textAlign: "center",
  },
});
