/**
 * Server side of the Mux direct-upload pipeline.
 *
 * This exists for one reason: the Mux API secret must never ship inside the Expo app
 * bundle. Everything else SetApart does talks to Firestore directly from the client —
 * this is the one place a server is required at all. Keep it that way; do not add
 * unrelated business logic here.
 */
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const muxTokenId = defineSecret('MUX_TOKEN_ID');
const muxTokenSecret = defineSecret('MUX_TOKEN_SECRET');

const muxAuthHeader = (): string =>
  `Basic ${Buffer.from(`${muxTokenId.value()}:${muxTokenSecret.value()}`).toString('base64')}`;

/** Every write in this file goes through the same two secrets — kept in one place. */
const SECRETS = [muxTokenId, muxTokenSecret];

type CreateUploadResult = { uploadId: string; uploadUrl: string };

/**
 * Opens a new Mux direct-upload slot. Restricted to signed-in users who already hold
 * the `organization` role — this mirrors the same check the Firestore security rules
 * should enforce on `videos` writes, so a rejected/never-verified account can't reach
 * Mux even if it somehow bypassed the client UI.
 */
export const createMuxUpload = onCall<undefined, Promise<CreateUploadResult>>(
  { secrets: SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const userSnapshot = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const roles = (userSnapshot.data()?.roles as string[] | undefined) ?? [];
    if (!roles.includes('organization')) {
      throw new HttpsError(
        'permission-denied',
        'Only a verified organization account can start a video upload.',
      );
    }

    const response = await fetch('https://api.mux.com/video/v1/uploads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: muxAuthHeader(),
      },
      body: JSON.stringify({
        cors_origin: '*',
        new_asset_settings: { playback_policy: ['public'] },
      }),
    });

    if (!response.ok) {
      throw new HttpsError('internal', `Mux rejected the upload request (${response.status}).`);
    }

    const body = (await response.json()) as { data: { id: string; url: string } };
    return { uploadId: body.data.id, uploadUrl: body.data.url };
  },
);

type UploadStatusResult =
  | { state: 'waiting' | 'processing' }
  | { state: 'ready'; playbackId: string; duration: number }
  | { state: 'errored'; message: string };

/**
 * Polls Mux on the client's behalf for how a given upload is progressing. Mux direct
 * uploads move through: upload receives the file -> an asset is created from it ->
 * the asset finishes preparing (transcoding) -> a playback ID is assigned. This
 * collapses that into the three states the client actually needs to act on.
 */
export const getMuxUploadStatus = onCall<{ uploadId?: unknown }, Promise<UploadStatusResult>>(
  { secrets: SECRETS },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }

    const uploadId = request.data?.uploadId;
    if (typeof uploadId !== 'string' || uploadId.length === 0) {
      throw new HttpsError('invalid-argument', 'uploadId is required.');
    }

    const headers = { Authorization: muxAuthHeader() };

    const uploadResponse = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
      headers,
    });
    if (!uploadResponse.ok) {
      throw new HttpsError('internal', `Could not check the upload (${uploadResponse.status}).`);
    }

    const uploadBody = (await uploadResponse.json()) as {
      data: { asset_id?: string; status: string };
    };

    if (['errored', 'cancelled', 'timed_out'].includes(uploadBody.data.status)) {
      return { state: 'errored', message: `Upload ${uploadBody.data.status}.` };
    }

    const assetId = uploadBody.data.asset_id;
    if (!assetId) {
      return { state: 'waiting' };
    }

    const assetResponse = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
      headers,
    });
    if (!assetResponse.ok) {
      throw new HttpsError('internal', `Could not check the asset (${assetResponse.status}).`);
    }

    const assetBody = (await assetResponse.json()) as {
      data: {
        status: string;
        duration?: number;
        playback_ids?: { id: string }[];
      };
    };

    if (assetBody.data.status === 'errored') {
      return { state: 'errored', message: 'Mux could not process this video.' };
    }

    const playbackId = assetBody.data.playback_ids?.[0]?.id;
    if (assetBody.data.status !== 'ready' || !playbackId) {
      return { state: 'processing' };
    }

    return {
      state: 'ready',
      playbackId,
      duration: Math.round(assetBody.data.duration ?? 0),
    };
  },
);
