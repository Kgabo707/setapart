import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ActivityIndicator, IconButton, Text } from 'react-native-paper';

import { palette, spacing } from '../../theme';
import { formatDuration } from '../../utils/format';
import {
  loadNativeVideo,
  type NativeVideoRef,
  type VideoErrorEvent,
  type VideoProgressEvent,
} from './nativeVideo';

const NativeVideo = loadNativeVideo();
const CONTROLS_TIMEOUT_MS = 3500;

type VideoPlayerSurfaceProps = {
  /** Mux HLS manifest URL. */
  streamUrl: string;
  posterUrl?: string;
  title: string;
  /** Seconds to resume from, applied once the asset reports its duration. */
  startPositionSeconds?: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onBack: () => void;
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
  onEnded?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const VideoPlayerSurface = ({
  streamUrl,
  posterUrl,
  title,
  startPositionSeconds = 0,
  isFullscreen,
  onToggleFullscreen,
  onBack,
  onProgress,
  onEnded,
  style,
}: VideoPlayerSurfaceProps) => {
  const playerRef = useRef<NativeVideoRef>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seeked = useRef(false);

  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [position, setPosition] = useState(startPositionSeconds);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (controlsVisible && !paused && !scrubbing) scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [controlsVisible, paused, scheduleHide, scrubbing]);

  const revealControls = useCallback(() => {
    setControlsVisible((visible) => !visible);
  }, []);

  const handleLoad = useCallback(
    ({ duration: assetDuration }: { duration: number }) => {
      setDuration(assetDuration);
      setBuffering(false);
      if (!seeked.current && startPositionSeconds > 0 && startPositionSeconds < assetDuration - 5) {
        playerRef.current?.seek(startPositionSeconds);
      }
      seeked.current = true;
    },
    [startPositionSeconds],
  );

  const handleProgress = useCallback(
    ({ currentTime, seekableDuration }: VideoProgressEvent) => {
      if (scrubbing) return;
      setPosition(currentTime);
      if (seekableDuration && !duration) setDuration(seekableDuration);
      onProgress?.(currentTime, seekableDuration || duration);
    },
    [duration, onProgress, scrubbing],
  );

  const handleError = useCallback((event: VideoErrorEvent) => {
    setBuffering(false);
    setError(
      event.error?.localizedDescription ??
        event.error?.errorString ??
        'This video could not be played right now.',
    );
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const target = Math.max(0, seconds);
    playerRef.current?.seek(target);
    setPosition(target);
  }, []);

  const skip = useCallback((delta: number) => seekTo(position + delta), [position, seekTo]);

  const progressRatio = useMemo(
    () => (duration > 0 ? Math.min(1, position / duration) : 0),
    [duration, position],
  );

  return (
    <View style={[styles.root, style]}>
      {NativeVideo && !error ? (
        <NativeVideo
          ref={playerRef}
          source={{ uri: streamUrl }}
          style={StyleSheet.absoluteFill}
          paused={paused}
          muted={muted}
          resizeMode="contain"
          playInBackground={false}
          ignoreSilentSwitch="ignore"
          progressUpdateInterval={500}
          poster={posterUrl}
          onLoad={handleLoad}
          onProgress={handleProgress}
          onReadyForDisplay={() => setBuffering(false)}
          onEnd={() => {
            setPaused(true);
            onEnded?.();
          }}
          onError={handleError}
        />
      ) : (
        <PlayerFallback
          posterUrl={posterUrl}
          message={
            error ??
            'Playback needs a development build. react-native-video is a native module, so it is not part of Expo Go — run `npx expo prebuild` then `npm run android` (or `npm run ios`).'
          }
        />
      )}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={revealControls}
        accessibilityRole="button"
        accessibilityLabel={controlsVisible ? 'Hide player controls' : 'Show player controls'}
      />

      {buffering && NativeVideo && !error ? (
        <View style={styles.bufferingLayer} pointerEvents="none">
          <ActivityIndicator animating size="large" color={palette.white} />
        </View>
      ) : null}

      {/*
        Inline, the transport controls fade out but there must always be a way off this
        screen, so the dismiss affordance lives outside the auto-hiding layer. In full
        screen it belongs with the rest of the chrome.
      */}
      {isFullscreen ? null : (
        <IconButton
          icon="chevron-down"
          iconColor={palette.white}
          size={26}
          onPress={onBack}
          style={styles.dismiss}
          containerColor="rgba(5, 15, 38, 0.45)"
          accessibilityLabel="Close player"
        />
      )}

      {controlsVisible ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(5,15,38,0.72)', 'transparent']}
            style={styles.topScrim}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(5,15,38,0.86)']}
            style={styles.bottomScrim}
            pointerEvents="none"
          />

          <View style={styles.topBar}>
            {isFullscreen ? (
              <IconButton
                icon="fullscreen-exit"
                iconColor={palette.white}
                size={26}
                onPress={onToggleFullscreen}
                accessibilityLabel="Exit full screen"
              />
            ) : (
              <View style={styles.topBarSpacer} />
            )}
            <Text
              variant="labelLarge"
              numberOfLines={1}
              style={[styles.topTitle, { color: palette.white }]}
            >
              {title}
            </Text>
            <IconButton
              icon={muted ? 'volume-off' : 'volume-high'}
              iconColor={palette.white}
              size={22}
              onPress={() => setMuted((value) => !value)}
              accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            />
          </View>

          <View style={styles.centerRow} pointerEvents="box-none">
            <IconButton
              icon="rewind-10"
              iconColor={palette.white}
              size={34}
              onPress={() => skip(-10)}
              accessibilityLabel="Rewind 10 seconds"
            />
            <IconButton
              icon={paused ? 'play' : 'pause'}
              iconColor={palette.white}
              size={40}
              mode="contained"
              containerColor="rgba(178, 34, 34, 0.92)"
              onPress={() => setPaused((value) => !value)}
              accessibilityLabel={paused ? 'Play' : 'Pause'}
            />
            <IconButton
              icon="fast-forward-30"
              iconColor={palette.white}
              size={34}
              onPress={() => skip(30)}
              accessibilityLabel="Forward 30 seconds"
            />
          </View>

          <View style={styles.bottomBar}>
            <Text variant="labelSmall" style={{ color: palette.white }}>
              {formatDuration(position)}
            </Text>
            <Slider
              style={styles.slider}
              value={progressRatio}
              minimumValue={0}
              maximumValue={1}
              minimumTrackTintColor={palette.crimson500}
              maximumTrackTintColor="rgba(255,255,255,0.35)"
              thumbTintColor={palette.crimson500}
              onSlidingStart={() => setScrubbing(true)}
              onValueChange={(value) => {
                if (duration > 0) setPosition(value * duration);
              }}
              onSlidingComplete={(value) => {
                setScrubbing(false);
                if (duration > 0) seekTo(value * duration);
                scheduleHide();
              }}
            />
            <Text variant="labelSmall" style={{ color: palette.white }}>
              {formatDuration(duration)}
            </Text>
            <IconButton
              icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
              iconColor={palette.white}
              size={22}
              onPress={onToggleFullscreen}
              accessibilityLabel={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const PlayerFallback = ({ posterUrl, message }: { posterUrl?: string; message: string }) => (
  <View style={StyleSheet.absoluteFill}>
    {posterUrl ? (
      <Image
        source={{ uri: posterUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    ) : null}
    <View style={styles.fallbackScrim}>
      <Text variant="bodySmall" style={styles.fallbackText}>
        {message}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { backgroundColor: palette.navy900, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bufferingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 96 },
  bottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  dismiss: { position: 'absolute', top: spacing.xs, left: spacing.xs, margin: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.xs,
  },
  topBarSpacer: { width: 48 },
  topTitle: { flex: 1 },
  centerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  slider: { flex: 1, height: 32 },
  fallbackScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5,15,38,0.72)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  fallbackText: { color: palette.navy100, textAlign: 'center' },
});
