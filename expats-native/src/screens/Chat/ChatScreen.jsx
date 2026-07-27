import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Avatar from "../../components/Avatar";
import GradientButton from "../../components/GradientButton";
import { VIBE_WARNING_THRESHOLD } from "../../config/appConfig";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { useDiscoverySettings } from "../../hooks/useDiscoverySettings";
import { markConversationRead, sendMessage, useMessages } from "../../hooks/useMessages";
import { useProfile } from "../../hooks/useProfiles";
import { useVibeCheck } from "../../hooks/useVibeCheck";
import { clockTime } from "../../utils/format";
import { uploadVoiceNote } from "../../utils/media";
import { displayNameOf, mainPhoto, subtitleOf } from "../../utils/profiles";
import IceBreaker from "./IceBreaker";
import TypingIndicator from "./TypingIndicator";
import VibeBar from "./VibeBar";
import VoiceNote, { VoiceNoteBubble } from "./VoiceNote";

export default function ChatScreen({ route, navigation }) {
  const { matchId, otherUid, otherProfile: passedProfile } = route.params || {};
  const { user } = useAuth();
  const { settings } = useDiscoverySettings();
  const { profile: fetchedProfile } = useProfile(passedProfile ? null : otherUid);
  const partner = passedProfile || fetchedProfile;

  const { messages, loading, botTyping, startBotTyping, stopBotTyping } = useMessages(matchId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showIceBreaker, setShowIceBreaker] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [vibeWarning, setVibeWarning] = useState(null);
  const [error, setError] = useState(null);
  const lastMessageId = useRef(null);

  const { vibe, scoring } = useVibeCheck(draft, {
    enabled: settings.vibeCheckEnabled,
    matchId,
  });

  useEffect(() => {
    markConversationRead(matchId);
  }, [matchId]);

  // The bot reply arrives as a Firestore write from onMessageSent.
  useEffect(() => {
    const newest = messages[0];
    if (!newest || newest.id === lastMessageId.current) return;
    lastMessageId.current = newest.id;
    if (newest.senderId !== user?.uid) stopBotTyping();
  }, [messages, user?.uid, stopBotTyping]);

  const deliver = useCallback(
    async (payload) => {
      if (!user || !matchId) return;
      setSending(true);
      setError(null);
      try {
        await sendMessage({
          matchId,
          senderId: user.uid,
          users: [user.uid, otherUid].filter(Boolean),
          ...payload,
        });
        if (partner?.isSeed !== false) startBotTyping();
      } catch (err) {
        setError(err.message);
      } finally {
        setSending(false);
      }
    },
    [user, matchId, otherUid, partner?.isSeed, startBotTyping]
  );

  async function handleSend(textOverride) {
    const text = (textOverride ?? draft).trim();
    if (!text) return;
    if (
      textOverride == null &&
      settings.vibeCheckEnabled &&
      vibe &&
      vibe.score < VIBE_WARNING_THRESHOLD
    ) {
      setVibeWarning(text);
      return;
    }
    setDraft("");
    await deliver({ text, type: "text" });
  }

  async function sendAnyway() {
    const text = vibeWarning;
    setVibeWarning(null);
    setDraft("");
    await deliver({ text, type: "text" });
  }

  async function handleVoiceNote({ uri, duration }) {
    if (!user || !matchId) return;
    setSending(true);
    setError(null);
    try {
      const audioUrl = await uploadVoiceNote(user.uid, matchId, uri);
      await deliver({
        text: "🎤 Voice note",
        type: "voice",
        duration,
        audioUrl,
      });
    } catch {
      setError("Couldn't upload that voice note. Try again.");
    } finally {
      setSending(false);
    }
  }

  const canSend = draft.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.ink} />
        </Pressable>
        <Avatar uri={mainPhoto(partner)} name={displayNameOf(partner)} size={40} />
        <View style={styles.headerTitles}>
          <Text style={styles.headerName} numberOfLines={1}>
            {displayNameOf(partner)}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitleOf(partner)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start video call"
          hitSlop={10}
          onPress={() =>
            navigation.navigate("VideoCall", { otherUid, otherProfile: partner, matchId })
          }
        >
          <Ionicons name="videocam" size={24} color={theme.colors.secondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            keyboardDismissMode="interactive"
            ListHeaderComponent={botTyping ? <TypingIndicator /> : null}
            ListFooterComponent={
              <Text style={styles.matchNote}>
                You matched with {displayNameOf(partner)}. Say something good.
              </Text>
            }
            renderItem={({ item }) => (
              <MessageBubble message={item} mine={item.senderId === user?.uid} />
            )}
          />
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {settings.vibeCheckEnabled ? <VibeBar vibe={vibe} scoring={scoring} /> : null}

        <View style={styles.inputBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ice breakers"
            onPress={() => setShowIceBreaker(true)}
            style={styles.iconButton}
          >
            <Text style={styles.iconEmoji}>⚡</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Record a voice note"
            onPress={() => setShowRecorder(true)}
            style={styles.iconButton}
          >
            <Ionicons name="mic-outline" size={20} color={theme.colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Video call"
            onPress={() =>
              navigation.navigate("VideoCall", { otherUid, otherProfile: partner, matchId })
            }
            style={styles.iconButton}
          >
            <Ionicons name="videocam-outline" size={20} color={theme.colors.ink} />
          </Pressable>

          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={theme.colors.muted}
            multiline
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={() => handleSend()}
            disabled={!canSend}
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          >
            <LinearGradient
              colors={theme.colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="arrow-up" size={20} color={theme.colors.white} />
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <IceBreaker
        visible={showIceBreaker}
        onClose={() => setShowIceBreaker(false)}
        onSend={(text) => handleSend(text)}
      />

      <VoiceNote
        visible={showRecorder}
        onClose={() => setShowRecorder(false)}
        onSend={handleVoiceNote}
      />

      <Modal
        visible={Boolean(vibeWarning)}
        transparent
        animationType="fade"
        onRequestClose={() => setVibeWarning(null)}
      >
        <View style={styles.warningBackdrop}>
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>This one might land badly</Text>
            <Text style={styles.warningBody}>
              Vibe Check scored this {vibe?.score ?? 0}/100.
              {vibe?.tip ? ` ${vibe.tip}` : " Try rewriting it before you send."}
            </Text>
            <GradientButton
              variant="solid"
              label="Let me rewrite it"
              onPress={() => setVibeWarning(null)}
            />
            <Pressable accessibilityRole="button" onPress={sendAnyway} style={styles.sendAnyway}>
              <Text style={styles.sendAnywayText}>Send anyway</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MessageBubble({ message, mine }) {
  const isVoice = message.type === "voice";

  const body = isVoice ? (
    <VoiceNoteBubble uri={message.audioUrl} duration={message.duration} mine={mine} />
  ) : (
    <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.text}</Text>
  );

  if (mine) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowMine]}>
        <LinearGradient
          colors={theme.colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleMine]}
        >
          {body}
          <Text style={[styles.timestamp, styles.timestampMine]}>
            {clockTime(message.createdAt)}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.bubble, styles.bubbleTheirs]}>
        {body}
        <Text style={styles.timestamp}>{clockTime(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitles: { flex: 1 },
  headerName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  headerSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  messages: {
    paddingVertical: theme.spacing.md,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  matchNote: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  bubbleRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    marginVertical: 3,
  },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "80%",
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: 2,
  },
  bubbleMine: { borderBottomRightRadius: theme.radius.sm },
  bubbleTheirs: {
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.sm,
  },
  messageText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.ink,
  },
  messageTextMine: { color: theme.colors.white },
  timestamp: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    color: theme.colors.muted,
    alignSelf: "flex-end",
  },
  timestampMine: { color: "rgba(255,255,255,0.75)" },
  error: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  iconEmoji: { fontSize: 16 },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 36,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 9,
    paddingBottom: 9,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  sendButtonDisabled: { opacity: 0.45 },
  sendGradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  warningBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  warningCard: {
    width: "100%",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  warningTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.ink,
  },
  warningBody: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  sendAnyway: { alignItems: "center", paddingVertical: theme.spacing.xs },
  sendAnywayText: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.primary,
  },
});
