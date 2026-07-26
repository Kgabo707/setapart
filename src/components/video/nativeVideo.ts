import type { ComponentType, Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type VideoLoadEvent = { duration: number };
export type VideoProgressEvent = { currentTime: number; seekableDuration: number };
export type VideoErrorEvent = { error?: { errorString?: string; localizedDescription?: string } };

export type NativeVideoRef = {
  seek: (time: number) => void;
};

export type NativeVideoProps = {
  source: { uri: string };
  ref?: Ref<NativeVideoRef>;
  style?: StyleProp<ViewStyle>;
  paused?: boolean;
  muted?: boolean;
  repeat?: boolean;
  poster?: string;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
  playInBackground?: boolean;
  progressUpdateInterval?: number;
  ignoreSilentSwitch?: 'ignore' | 'obey';
  onLoad?: (event: VideoLoadEvent) => void;
  onProgress?: (event: VideoProgressEvent) => void;
  onEnd?: () => void;
  onError?: (event: VideoErrorEvent) => void;
  onReadyForDisplay?: () => void;
};

/**
 * `react-native-video` ships a native module, so it is absent in Expo Go and on web.
 * Resolving it lazily lets the rest of the player screen render (artwork, metadata,
 * actions) with a clear message instead of a redbox when the module is missing.
 *
 * In a development build or a release build produced by `expo prebuild`, this resolves
 * to the real component.
 */
export const loadNativeVideo = (): ComponentType<NativeVideoProps> | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('react-native-video');
    return (module?.default ?? module?.Video ?? null) as ComponentType<NativeVideoProps> | null;
  } catch {
    return null;
  }
};
