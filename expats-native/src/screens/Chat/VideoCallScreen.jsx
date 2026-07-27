import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";

import Avatar from "../../components/Avatar";
import { theme } from "../../config/theme";
import { useAuth } from "../../hooks/useAuth";
import { RTCView, useVideoCall } from "../../hooks/useVideoCall";
import { formatDuration } from "../../utils/format";
import { displayNameOf, mainPhoto } from "../../utils/profiles";

const BOT_UNAVAILABLE_DELAY_MS = 3000;

export default function VideoCallScreen({ route, navigation }) {
  const { otherProfile, matchId } = route.params || {};
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [seconds, setSeconds] = useState(0);
  const [botUnavailable, setBotUnavailable] = useState(false);
  const timer = useRef(null);

  // Seed profiles are Claude-driven bots, so there is nobody to pick up.
  const isBot = otherProfile?.isSeed !== false;

  const call = useVideoCall({ matchId, myUid: user?.uid, enabled: !isBot });
  const {
    supported,
    status: callStatus,
    localStream,
    remoteStream,
    muted,
    videoOff,
    toggleMute,
    toggleVideo,
    endCall,
  } = call;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  useEffect(() => {
    if (!isBot) return undefined;
    const timeout = setTimeout(() => setBotUnavailable(true), BOT_UNAVAILABLE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [isBot]);

  const connected = callStatus === "connected";

  useEffect(() => {
    if (!connected) return undefined;
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [connected]);

  function statusLabel() {
    if (isBot) return botUnavailable ? "Not available right now" : "Calling…";
    if (connected) return formatDuration(seconds);
    if (callStatus === "failed") return "Couldn't connect";
    if (callStatus === "unsupported") return "Camera preview only";
    return "Connecting…";
  }

  async function hangUp() {
    await endCall();
    navigation.goBack();
  }

  const showRemoteVideo = Boolean(RTCView && remoteStream);
  const showLocalVideo = Boolean(RTCView && localStream && !videoOff);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        {showRemoteVideo ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
          />
        ) : null}

        <View style={styles.remote} pointerEvents="none">
          {!showRemoteVideo ? (
            <>
              <Avatar
                uri={mainPhoto(otherProfile)}
                name={displayNameOf(otherProfile)}
                size={140}
                style={styles.remoteAvatar}
              />
              <Text style={styles.remoteName}>{displayNameOf(otherProfile)}</Text>
            </>
          ) : null}
          <Text style={styles.status}>{statusLabel()}</Text>
          {isBot && botUnavailable ? (
            <Text style={styles.unavailableHint}>
              {displayNameOf(otherProfile)} can&apos;t take video calls yet. Keep the conversation
              going in chat.
            </Text>
          ) : null}
          {!supported && !isBot ? (
            <Text style={styles.unavailableHint}>
              Live calls need a development build — react-native-webrtc isn&apos;t available in
              Expo Go.
            </Text>
          ) : null}
        </View>

        <View style={styles.pip}>
          {showLocalVideo ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.flex}
              objectFit="cover"
              mirror
            />
          ) : permission?.granted && !videoOff ? (
            <CameraView style={styles.flex} facing="front" />
          ) : (
            <View style={[styles.flex, styles.pipOff]}>
              <Ionicons
                name={videoOff ? "videocam-off" : "camera-outline"}
                size={22}
                color={theme.colors.muted}
              />
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <ControlButton
            icon={muted ? "mic-off" : "mic"}
            label={muted ? "Unmute" : "Mute"}
            active={muted}
            onPress={toggleMute}
          />
          <ControlButton
            icon={videoOff ? "videocam-off" : "videocam"}
            label={videoOff ? "Video on" : "Video off"}
            active={videoOff}
            onPress={toggleVideo}
          />
          <ControlButton icon="call" label="End" danger onPress={hangUp} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function ControlButton({ icon, label, onPress, active, danger }) {
  return (
    <View style={styles.controlWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.controlButton, active && styles.controlActive, danger && styles.controlDanger]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={danger || active ? theme.colors.white : theme.colors.ink}
          style={danger ? styles.endIcon : undefined}
        />
      </Pressable>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0B15" },
  flex: { flex: 1 },
  remote: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  remoteAvatar: { borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },
  remoteName: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.white,
    marginTop: theme.spacing.md,
  },
  status: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },
  unavailableHint: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  pip: {
    position: "absolute",
    top: theme.spacing.xl * 2,
    right: theme.spacing.md,
    width: 108,
    height: 152,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pipOff: { alignItems: "center", justifyContent: "center" },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  controlWrap: { alignItems: "center", gap: 6 },
  controlButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  controlActive: { backgroundColor: theme.colors.secondary },
  controlDanger: { backgroundColor: theme.colors.primary },
  endIcon: { transform: [{ rotate: "135deg" }] },
  controlLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
});
