import { useCallback, useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "../config/firebase";

// react-native-webrtc needs a dev build; in Expo Go the require throws and the
// screen falls back to a local camera preview.
let WebRTC = null;
try {
  WebRTC = require("react-native-webrtc");
} catch {
  WebRTC = null;
}

export const webrtcSupported = Boolean(WebRTC?.RTCPeerConnection);
export const RTCView = WebRTC?.RTCView || null;

const PC_CONFIG = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

const MEDIA_CONSTRAINTS = {
  audio: true,
  video: { facingMode: "user", width: 640, height: 480 },
};

/**
 * Peer-to-peer video calling with Firestore as the signalling channel:
 * calls/{matchId} holds the offer/answer and the two candidate subcollections.
 */
export function useVideoCall({ matchId, myUid, enabled }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | failed | unsupported
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const pcRef = useRef(null);
  const unsubsRef = useRef([]);

  const cleanup = useCallback(async () => {
    unsubsRef.current.forEach((unsub) => unsub());
    unsubsRef.current = [];
    pcRef.current?.close?.();
    pcRef.current = null;
    setRemoteStream(null);
    setLocalStream((stream) => {
      stream?.getTracks?.().forEach((track) => track.stop());
      return null;
    });
  }, []);

  const endCall = useCallback(async () => {
    await cleanup();
    if (matchId && isFirebaseConfigured) {
      await updateDoc(doc(db, "calls", matchId), { status: "ended" }).catch(() => {});
    }
    setStatus("idle");
  }, [cleanup, matchId]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!webrtcSupported || !isFirebaseConfigured || !matchId || !myUid) {
      setStatus("unsupported");
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setStatus("connecting");
      try {
        const stream = await WebRTC.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);

        const pc = new WebRTC.RTCPeerConnection(PC_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.addEventListener("track", (event) => {
          if (event.streams?.[0]) setRemoteStream(event.streams[0]);
        });
        pc.addEventListener("connectionstatechange", () => {
          if (pc.connectionState === "connected") setStatus("connected");
          if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
            setStatus((prev) => (prev === "connected" ? "idle" : "failed"));
          }
        });

        const callRef = doc(db, "calls", matchId);
        const callerCandidates = collection(callRef, "callerCandidates");
        const calleeCandidates = collection(callRef, "calleeCandidates");
        const existing = await getDoc(callRef);
        const live =
          existing.exists() &&
          existing.data().status === "ringing" &&
          existing.data().callerUid !== myUid;

        if (live) {
          // Someone is already ringing us: answer their offer.
          const data = existing.data();
          pc.addEventListener("icecandidate", (event) => {
            if (event.candidate) addDoc(calleeCandidates, event.candidate.toJSON()).catch(() => {});
          });
          await pc.setRemoteDescription(new WebRTC.RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await updateDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp } });
          unsubsRef.current.push(
            onSnapshot(callerCandidates, (snap) => {
              snap.docChanges().forEach((change) => {
                if (change.type === "added") {
                  pc.addIceCandidate(new WebRTC.RTCIceCandidate(change.doc.data())).catch(() => {});
                }
              });
            })
          );
        } else {
          pc.addEventListener("icecandidate", (event) => {
            if (event.candidate) addDoc(callerCandidates, event.candidate.toJSON()).catch(() => {});
          });
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await setDoc(callRef, {
            matchId,
            callerUid: myUid,
            offer: { type: offer.type, sdp: offer.sdp },
            answer: null,
            status: "ringing",
            createdAt: serverTimestamp(),
          });
          unsubsRef.current.push(
            onSnapshot(callRef, (snap) => {
              const data = snap.data();
              if (data?.answer && !pc.currentRemoteDescription) {
                pc.setRemoteDescription(new WebRTC.RTCSessionDescription(data.answer)).catch(
                  () => {}
                );
              }
              if (data?.status === "ended") endCall();
            })
          );
          unsubsRef.current.push(
            onSnapshot(calleeCandidates, (snap) => {
              snap.docChanges().forEach((change) => {
                if (change.type === "added") {
                  pc.addIceCandidate(new WebRTC.RTCIceCandidate(change.doc.data())).catch(() => {});
                }
              });
            })
          );
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
      if (matchId) deleteDoc(doc(db, "calls", matchId)).catch(() => {});
    };
  }, [enabled, matchId, myUid, cleanup, endCall]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStream?.getAudioTracks?.().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    setVideoOff((prev) => {
      const next = !prev;
      localStream?.getVideoTracks?.().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, [localStream]);

  return {
    supported: webrtcSupported,
    status,
    localStream,
    remoteStream,
    muted,
    videoOff,
    toggleMute,
    toggleVideo,
    endCall,
  };
}

export default useVideoCall;
