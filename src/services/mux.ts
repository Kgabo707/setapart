/**
 * Mux delivery helpers.
 *
 * `Video.videoAssetId` holds the *public playback ID* Mux returns for an asset. The
 * upload pipeline that mints those IDs is out of scope for this build — we assume the
 * value already exists in Firestore and only derive delivery URLs from it here.
 */

const STREAM_BASE = 'https://stream.mux.com';
const IMAGE_BASE = 'https://image.mux.com';

export type MuxThumbnailOptions = {
  width?: number;
  height?: number;
  /** Seconds into the asset to grab the still from. */
  time?: number;
  fitMode?: 'preserve' | 'stretch' | 'crop' | 'smartcrop' | 'pad';
};

/** HLS manifest URL for `react-native-video`. */
export const muxStreamUrl = (playbackId: string): string =>
  `${STREAM_BASE}/${playbackId}.m3u8`;

export const muxThumbnailUrl = (
  playbackId: string,
  { width = 640, height, time = 2, fitMode = 'smartcrop' }: MuxThumbnailOptions = {},
): string => {
  const params = new URLSearchParams({
    width: String(width),
    time: String(time),
    fit_mode: fitMode,
  });
  if (height) params.set('height', String(height));
  return `${IMAGE_BASE}/${playbackId}/thumbnail.jpg?${params.toString()}`;
};

/** Short looping preview used on hover/long-press affordances. */
export const muxAnimatedPreviewUrl = (playbackId: string, width = 320): string =>
  `${IMAGE_BASE}/${playbackId}/animated.gif?width=${width}`;
