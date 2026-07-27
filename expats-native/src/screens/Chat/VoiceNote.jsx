import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";

import GradientButton from "../../components/GradientButton";
import { MAX_VOICE_NOTE_SECONDS } from "../../config/appConfig";
import { theme } from "../../config/theme";
import { formatDuration } from "../../utils/format";

const BAR_COUNT = 32;
const IDLE_BAR_HEIGHT = 0.18;

/** Deterministic pseudo-waveform so a given note always renders the same. */
function waveformFor(seed = 1, count = BAR_COUNT) {
  return Array.from({ length: count }, (_, i) => {
    const value = Math.abs(Math.sin((i + 1) * seed * 1.7)) * 0.75 + 0.25;
    return Math.min(1, value);
  });
}

export function Waveform({ levels, color, activeRatio = 1, height = 34, style }) {
  return (
    <View style={[styles.waveform, { height }, style]}>
      {levels.map((level, index) => {
        const active = index / levels.length <= activeRatio;
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: Math.max(3, level * height),
                backgroundColor: color,
                opacity: active ? 1 : 0.35,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function VoiceNoteBubble({ uri, duration, mine }) {
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const levels = useMemo(() => waveformFor((duration || 3) + 1, 24), [duration]);
  const color = mine ? theme.colors.white : theme.colors.secondary;

  useEffect(() => () => {
    sound?.unloadAsync().catch(() => {});
  }, [sound]);

  async function toggle() {
    if (!uri) return;
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isPlaying) {
        await sound.pauseAsync();
        setPlaying(false);
      } else {
        await sound.playAsync();
        setPlaying(true);
      }
      return;
    }
    const { sound: created } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      (status) => {
        if (!status.isLoaded) return;
        setPosition((status.positionMillis || 0) / 1000);
        if (status.didJustFinish) {
          setPlaying(false);
          setPosition(0);
        }
      }
    );
    setSound(created);
    setPlaying(true);
  }

  const total = duration || 1;

  return (
    <View style={styles.bubbleRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? "Pause voice note" : "Play voice note"}
        onPress={toggle}
        style={[styles.playButton, { borderColor: color }]}
      >
        <Ionicons name={playing ? "pause" : "play"} size={16} color={color} />
      </Pressable>
      <Waveform levels={levels} color={color} activeRatio={position / total} height={28} />
      <Text style={[styles.bubbleDuration, { color }]}>{formatDuration(duration)}</Text>
    </View>
  );
}

export default function VoiceNote({ visible, onClose, onSend }) {
  const [recording, setRecording] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [recordedUri, setRecordedUri] = useState(null);
  const [levels, setLevels] = useState(() => Array(BAR_COUNT).fill(IDLE_BAR_HEIGHT));
  const [previewSound, setPreviewSound] = useState(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const stopRecording = useCallback(
    async (current) => {
      const active = current || recording;
      if (!active) return null;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      try {
        await active.stopAndUnloadAsync();
      } catch {
        // already stopped
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = active.getURI();
      setRecording(null);
      setRecordedUri(uri);
      return uri;
    },
    [recording]
  );

  useEffect(() => {
    if (visible) return undefined;
    // Closing the sheet must never leave the mic hot.
    if (recording) stopRecording(recording);
    previewSound?.unloadAsync().catch(() => {});
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    []
  );

  async function startRecording() {
    setError(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError("Microphone permission is needed to record a voice note.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: created } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering != null) {
            // metering is dBFS (-160..0); map it onto a 0..1 bar height.
            const level = Math.max(0.12, Math.min(1, (status.metering + 60) / 60));
            setLevels((prev) => [...prev.slice(1), level]);
          }
        },
        100
      );
      setRecording(created);
      setRecordedUri(null);
      setSeconds(0);
      timer.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_VOICE_NOTE_SECONDS) stopRecording(created);
          return Math.min(next, MAX_VOICE_NOTE_SECONDS);
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePreview() {
    if (!recordedUri) return;
    if (previewSound) {
      const status = await previewSound.getStatusAsync();
      if (status.isPlaying) {
        await previewSound.pauseAsync();
        setPreviewPlaying(false);
      } else {
        await previewSound.replayAsync();
        setPreviewPlaying(true);
      }
      return;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: recordedUri }, { shouldPlay: true }, (s) => {
      if (s.isLoaded && s.didJustFinish) setPreviewPlaying(false);
    });
    setPreviewSound(sound);
    setPreviewPlaying(true);
  }

  async function discard() {
    if (recording) await stopRecording(recording);
    await previewSound?.unloadAsync().catch(() => {});
    setPreviewSound(null);
    setPreviewPlaying(false);
    setRecordedUri(null);
    setSeconds(0);
    setLevels(Array(BAR_COUNT).fill(IDLE_BAR_HEIGHT));
  }

  async function close() {
    await discard();
    onClose();
  }

  async function send() {
    if (!recordedUri) return;
    const duration = seconds;
    await previewSound?.unloadAsync().catch(() => {});
    setPreviewSound(null);
    onSend({ uri: recordedUri, duration });
    setRecordedUri(null);
    setSeconds(0);
    setLevels(Array(BAR_COUNT).fill(IDLE_BAR_HEIGHT));
    onClose();
  }

  const isRecording = Boolean(recording);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close recorder" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Voice note</Text>
        <Text style={styles.subtitle}>
          {isRecording
            ? `Recording — max ${MAX_VOICE_NOTE_SECONDS}s`
            : recordedUri
              ? "Have a listen before you send it."
              : "Tap record and say hello."}
        </Text>

        <Waveform
          levels={levels}
          color={isRecording ? theme.colors.primary : theme.colors.secondary}
          height={56}
          style={styles.recorderWave}
        />

        <Text style={styles.timer}>{formatDuration(seconds)}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controls}>
          {recordedUri ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Discard recording"
                onPress={discard}
                style={styles.secondaryButton}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.muted} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={previewPlaying ? "Pause preview" : "Play preview"}
                onPress={togglePreview}
                style={styles.secondaryButton}
              >
                <Ionicons
                  name={previewPlaying ? "pause" : "play"}
                  size={20}
                  color={theme.colors.secondary}
                />
              </Pressable>
              <GradientButton label="Send voice note" onPress={send} style={styles.sendButton} />
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
              onPress={isRecording ? () => stopRecording() : startRecording}
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            >
              <Ionicons
                name={isRecording ? "square" : "mic"}
                size={26}
                color={theme.colors.white}
              />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(26,26,46,0.45)" },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.ink,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: "center",
  },
  recorderWave: { marginVertical: theme.spacing.md, alignSelf: "stretch" },
  timer: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.ink,
  },
  error: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.primary,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonActive: { backgroundColor: theme.colors.ink },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButton: { flex: 1 },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  bar: { flex: 1, borderRadius: 2, minWidth: 2 },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minWidth: 190,
  },
  playButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleDuration: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
  },
});
