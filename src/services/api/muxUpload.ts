/**
 * Client side of the Mux direct-upload pipeline.
 *
 * The Mux API secret must never ship in the app bundle, so upload creation and status
 * polling are Cloud Functions (`functions/src/index.ts`) — this file only ever talks to
 * those functions and to the one-time-use URL Mux hands back, never to the Mux API
 * directly. In demo mode (no Firebase project configured) there is nothing to call
 * against, so every export here throws a clear error instead of silently no-op'ing.
 */
import { httpsCallable } from 'firebase/functions';
import { File, UploadType } from 'expo-file-system';

import { getFunctionsClient, isFirebaseConfigured } from '../firebase';

export type MuxUploadStatus =
  | { state: 'waiting' | 'processing' }
  | { state: 'ready'; playbackId: string; duration: number }
  | { state: 'errored'; message: string };

const requireFirebase = () => {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Uploading needs a configured Firebase project — demo mode has nowhere to send the file.',
    );
  }
};

/** Asks the server to open a new Mux direct upload slot. Requires the organization role. */
export const createMuxUpload = async (): Promise<{ uploadId: string; uploadUrl: string }> => {
  requireFirebase();
  const call = httpsCallable<undefined, { uploadId: string; uploadUrl: string }>(
    getFunctionsClient(),
    'createMuxUpload',
  );
  const { data } = await call();
  return data;
};

/** Polls the server, which polls Mux, for how a given upload is progressing. */
export const getMuxUploadStatus = async (uploadId: string): Promise<MuxUploadStatus> => {
  requireFirebase();
  const call = httpsCallable<{ uploadId: string }, MuxUploadStatus>(
    getFunctionsClient(),
    'getMuxUploadStatus',
  );
  const { data } = await call({ uploadId });
  return data;
};

/**
 * Puts the picked file's bytes to the one-time-use URL Mux issued. This is a plain PUT
 * of the raw file — Mux's direct-upload URLs are not multipart endpoints.
 */
export const uploadFileToMux = async (
  fileUri: string,
  uploadUrl: string,
  onProgress?: (fraction: number) => void,
): Promise<void> => {
  const file = new File(fileUri);
  const task = file.createUploadTask(uploadUrl, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    onProgress: ({ bytesSent, totalBytes }) => {
      if (totalBytes > 0) onProgress?.(bytesSent / totalBytes);
    },
  });

  const result = await task.uploadAsync();
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed (status ${result.status}).`);
  }
};

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 5 * 60_000;

/**
 * Polls until Mux reports the asset ready (or errored), or gives up after five minutes
 * — processing can occasionally run long for large files, at which point the organization
 * can check back on the upload from Manage videos rather than staring at a spinner.
 */
export const waitForMuxAsset = async (
  uploadId: string,
  onStatus?: (status: MuxUploadStatus) => void,
): Promise<{ playbackId: string; duration: number }> => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const status = await getMuxUploadStatus(uploadId);
    onStatus?.(status);

    if (status.state === 'ready') return { playbackId: status.playbackId, duration: status.duration };
    if (status.state === 'errored') throw new Error(status.message);

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Mux is still processing this video. Check back shortly from Manage videos.');
};
