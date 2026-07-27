import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "../config/firebase";

/**
 * React Native has no File/Blob from disk, so a local file:// uri has to be
 * fetched into a blob before it can be uploaded.
 */
export async function uploadFromUri(uri, path, contentType) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, blob, contentType ? { contentType } : undefined);
  return getDownloadURL(fileRef);
}

export function uploadProfilePhoto(uid, uri) {
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  return uploadFromUri(uri, `profilePhotos/${uid}/${Date.now()}.${ext}`, `image/${ext}`);
}

export function uploadVoiceNote(uid, matchId, uri) {
  const ext = uri.split(".").pop()?.split("?")[0] || "m4a";
  return uploadFromUri(
    uri,
    `voiceNotes/${matchId}/${uid}-${Date.now()}.${ext}`,
    "audio/m4a"
  );
}
