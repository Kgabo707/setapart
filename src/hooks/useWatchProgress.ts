import { useCallback } from 'react';

import { useAuth } from '../context/AuthContext';
import type { Video } from '../types/models';

/** Maps watch history onto videos so cards can draw a resume bar. */
export const useWatchProgress = () => {
  const { user } = useAuth();

  const positionFor = useCallback(
    (videoId: string): number | undefined =>
      user?.watchHistory.find((entry) => entry.videoId === videoId)?.positionSeconds,
    [user],
  );

  const progressFor = useCallback(
    (video: Pick<Video, 'id' | 'duration'>): number | undefined => {
      const position = positionFor(video.id);
      if (position === undefined || video.duration <= 0) return undefined;
      return Math.min(1, position / video.duration);
    },
    [positionFor],
  );

  return { positionFor, progressFor };
};
