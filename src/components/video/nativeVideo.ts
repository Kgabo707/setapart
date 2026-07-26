import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { ComponentType, Ref } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

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
 * Expo Go bundles a fixed set of native modules and `react-native-video` is not among
 * them. Importing it there still succeeds — it binds through `requireNativeComponent`,
 * which resolves lazily and renders an "Unimplemented component" box rather than
 * throwing — so the environment has to be checked directly instead of relying on the
 * import failing.
 *
 * Web is fine: the package ships a `.web.js` implementation backed by `<video>`.
 */
export const isNativeVideoAvailable =
  Platform.OS === 'web' ||
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/**
 * Resolves the player component, or `null` when it cannot work in this runtime. Lets
 * the player screen render its artwork, metadata and actions with an explanatory
 * notice instead of a broken video surface.
 */
export const loadNativeVideo = (): ComponentType<NativeVideoProps> | null => {
  if (!isNativeVideoAvailable) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('react-native-video');
    return (module?.default ?? module?.Video ?? null) as ComponentType<NativeVideoProps> | null;
  } catch {
    return null;
  }
};
