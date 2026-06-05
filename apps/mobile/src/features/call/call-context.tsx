import { Audio } from "expo-av";
import { Camera } from "expo-camera";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

import {
  startIncomingRingtone,
  stopIncomingRingtone,
  startOutgoingRingback,
  stopOutgoingRingback,
  stopAllCallSounds,
} from "@/lib/call-sounds";

import { WebRTCManager, type MediaStream } from "@/lib/webrtc/webrtc-manager";
import {
  emitCallAnswer,
  emitCallAnswerSdp,
  emitCallEnd,
  emitCallIceCandidate,
  emitCallLeave,
  emitCallOffer,
  emitCallInitiate,
  getCallSocket,
  subscribeCallSocket,
  type CallType,
} from "@/services/socket/call-socket";
import { USE_API_MOCK } from "@/constants/env";

export type { CallType };

export type ParticipantInfo = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export type CallState =
  | { phase: "idle" }
  | {
      phase: "outgoing";
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      conversationTitle: string;
      conversationAvatarUrl?: string;
    }
  | {
      phase: "incoming";
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      callerId: string;
      callerName: string;
      callerAvatarUrl?: string | null;
      totalInvited: number;
    }
  | {
      phase: "active";
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      conversationTitle: string;
      conversationAvatarUrl?: string;
      participants: ParticipantInfo[];
      startedAt: Date;
    };

export type RemoteStream = {
  peerId: string;
  stream: MediaStream;
};

export type CallContextValue = {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaker: boolean;
  initiateCall: (opts: {
    callId: string;
    conversationId: string;
    callType: CallType;
    isGroup: boolean;
    conversationTitle: string;
    conversationAvatarUrl?: string;
  }) => Promise<void>;
  answerCall: (accepted: boolean) => Promise<void>;
  endCall: () => void;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => Promise<void>;
};

const CallContext = createContext<CallContextValue | null>(null);

async function requestCallPermissions(callType: CallType): Promise<boolean> {
  const audioResult = await Audio.requestPermissionsAsync();
  if (!audioResult.granted) {
    Alert.alert("Quyền micro", "Cần cấp quyền micro để thực hiện cuộc gọi.");
    return false;
  }
  if (callType === "video") {
    const cameraResult = await Camera.requestCameraPermissionsAsync();
    if (!cameraResult.granted) {
      Alert.alert("Quyền camera", "Cần cấp quyền camera để thực hiện cuộc gọi video.");
      return false;
    }
  }
  return true;
}

async function setAudioModeForCall(speaker: boolean) {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
  });
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>({ phase: "idle" });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  const mgrRef = useRef<WebRTCManager | null>(null);
  const stateRef = useRef<CallState>({ phase: "idle" });
  stateRef.current = callState;

  // ── Ringtone / ringback ───────────────────────────────────────────────────
  useEffect(() => {
    if (callState.phase === "incoming") {
      void startIncomingRingtone();
    } else if (callState.phase === "outgoing") {
      void startOutgoingRingback();
    } else {
      void stopAllCallSounds();
    }
    return () => {
      void stopAllCallSounds();
    };
  }, [callState.phase]);

  const teardown = useCallback(() => {
    mgrRef.current?.destroy();
    mgrRef.current = null;
    setLocalStream(null);
    setRemoteStreams([]);
    setIsMuted(false);
    setIsCameraOff(false);
    void stopAllCallSounds();
    void Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: false }).catch(() => {});
  }, []);

  const getOrBuildManager = useCallback((callId: string): WebRTCManager => {
    if (mgrRef.current) return mgrRef.current;
    const mgr = new WebRTCManager({
      onLocalStream: setLocalStream,
      onRemoteStream: (peerId, stream) =>
        setRemoteStreams((prev) => [
          ...prev.filter((r) => r.peerId !== peerId),
          { peerId, stream },
        ]),
      onRemoteStreamRemoved: (peerId) =>
        setRemoteStreams((prev) => prev.filter((r) => r.peerId !== peerId)),
      onIceCandidate: (peerId, candidate) =>
        emitCallIceCandidate({ callId, to: peerId, candidate }),
    });
    mgrRef.current = mgr;
    return mgr;
  }, []);

  // ── Public actions ────────────────────────────────────────────────────────

  const initiateCall = useCallback(
    async (opts: {
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      conversationTitle: string;
      conversationAvatarUrl?: string;
    }) => {
      if (USE_API_MOCK) return;
      const allowed = await requestCallPermissions(opts.callType);
      if (!allowed) return;
      teardown();
      setCallState({
        phase: "outgoing",
        callId: opts.callId,
        conversationId: opts.conversationId,
        callType: opts.callType,
        isGroup: opts.isGroup,
        conversationTitle: opts.conversationTitle,
        conversationAvatarUrl: opts.conversationAvatarUrl,
      });
      // Signal the call intent first so the server/callee are notified
      // regardless of whether local media initialization succeeds.
      emitCallInitiate({
        callId: opts.callId,
        conversationId: opts.conversationId,
        callType: opts.callType,
      });
      await setAudioModeForCall(true);
      const mgr = getOrBuildManager(opts.callId);
      await mgr.initLocalStream(opts.callType);
    },
    [teardown, getOrBuildManager],
  );

  const answerCall = useCallback(
    async (accepted: boolean) => {
      const state = stateRef.current;
      if (state.phase !== "incoming") return;
      if (!accepted) {
        emitCallAnswer({ callId: state.callId, accepted: false });
        setCallState({ phase: "idle" });
        return;
      }
      const allowed = await requestCallPermissions(state.callType);
      if (!allowed) {
        emitCallAnswer({ callId: state.callId, accepted: false });
        setCallState({ phase: "idle" });
        return;
      }
      await setAudioModeForCall(true);
      const mgr = getOrBuildManager(state.callId);
      await mgr.initLocalStream(state.callType);
      emitCallAnswer({ callId: state.callId, accepted: true });
    },
    [getOrBuildManager],
  );

  const leaveCall = useCallback(() => {
    const state = stateRef.current;
    if (state.phase !== "idle") {
      emitCallLeave(state.callId);
    }
    teardown();
    setCallState({ phase: "idle" });
  }, [teardown]);

  const endCall = useCallback(() => {
    const state = stateRef.current;
    if (state.phase !== "idle") {
      emitCallEnd(state.callId);
    }
    teardown();
    setCallState({ phase: "idle" });
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const muted = mgrRef.current?.toggleAudio() ?? false;
    setIsMuted(muted);
  }, []);

  const toggleCamera = useCallback(() => {
    const off = mgrRef.current?.toggleVideo() ?? false;
    setIsCameraOff(off);
  }, []);

  const toggleSpeaker = useCallback(async () => {
    const next = !isSpeaker;
    setIsSpeaker(next);
    // Trên iOS, outputLatency kiểm soát speaker vs earpiece thông qua allowsRecordingIOS workaround
    // expo-av không expose trực tiếp, dùng Audio.setAudioModeAsync với combinedMix
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch {
      /* ignore */
    }
  }, [isSpeaker]);

  // ── Socket event handlers ─────────────────────────────────────────────────

  useEffect(() => {
    // Re-attach listeners whenever the socket instance changes (connect/disconnect).
    let currentSocket = null as import("socket.io-client").Socket | null;

    function attach(socket: import("socket.io-client").Socket | null) {
      if (currentSocket) {
        currentSocket.off("call:incoming");
        currentSocket.off("call:joined");
        currentSocket.off("call:peer_joined");
        currentSocket.off("call:peer_left");
        currentSocket.off("call:peer_declined");
        currentSocket.off("call:offer");
        currentSocket.off("call:answer_sdp");
        currentSocket.off("call:ice_candidate");
        currentSocket.off("call:ended");
        currentSocket.off("call:busy");
        currentSocket = null;
      }
      if (!socket) return;
      currentSocket = socket;

      /* NOTE: handlers below use stateRef/mgrRef/teardown/getOrBuildManager
         which are stable refs — safe to close over. */

    const onIncoming = (p: {
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      callerId: string;
      callerName: string;
      callerAvatarUrl?: string | null;
      totalInvited: number;
    }) => {
      if (stateRef.current.phase !== "idle") {
        socket.emit("call:answer", { callId: p.callId, accepted: false });
        return;
      }
      setCallState({
        phase: "incoming",
        callId: p.callId,
        conversationId: p.conversationId,
        callType: p.callType,
        isGroup: p.isGroup,
        callerId: p.callerId,
        callerName: p.callerName,
        callerAvatarUrl: p.callerAvatarUrl,
        totalInvited: p.totalInvited,
      });
    };

    const onJoined = (p: {
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      existingParticipants: ParticipantInfo[];
    }) => {
      const state = stateRef.current;
      if (state.phase === "idle") return;
      const title =
        state.phase === "incoming"
          ? state.callerName
          : state.phase === "outgoing" || state.phase === "active"
            ? state.conversationTitle
            : "";
      const avatarUrl =
        state.phase === "outgoing" || state.phase === "active"
          ? state.conversationAvatarUrl
          : undefined;
      setCallState({
        phase: "active",
        callId: p.callId,
        conversationId: p.conversationId,
        callType: p.callType,
        isGroup: p.isGroup,
        conversationTitle: title,
        conversationAvatarUrl: avatarUrl,
        participants: p.existingParticipants,
        startedAt: new Date(),
      });
    };

    const onPeerJoined = async (p: {
      callId: string;
      peerId: string;
      peerDisplayName: string;
      peerAvatarUrl: string | null;
    }) => {
      const state = stateRef.current;
      if (state.phase === "idle") return;

      setCallState((prev) => {
        if (prev.phase === "outgoing") {
          return {
            phase: "active",
            callId: p.callId,
            conversationId: prev.conversationId,
            callType: prev.callType,
            isGroup: prev.isGroup,
            conversationTitle: prev.conversationTitle,
            conversationAvatarUrl: prev.conversationAvatarUrl,
            participants: [
              { userId: p.peerId, displayName: p.peerDisplayName, avatarUrl: p.peerAvatarUrl },
            ],
            startedAt: new Date(),
          };
        }
        if (prev.phase !== "active") return prev;
        if (prev.participants.some((x) => x.userId === p.peerId)) return prev;
        return {
          ...prev,
          participants: [
            ...prev.participants,
            { userId: p.peerId, displayName: p.peerDisplayName, avatarUrl: p.peerAvatarUrl },
          ],
        };
      });

      const mgr = mgrRef.current;
      if (!mgr) return;
      const offer = await mgr.createOffer(p.peerId);
      emitCallOffer({ callId: p.callId, to: p.peerId, sdp: offer });
    };

    const onPeerLeft = (p: { callId: string; peerId: string }) => {
      mgrRef.current?.removePeer(p.peerId);
      setCallState((prev) => {
        if (prev.phase !== "active") return prev;
        return {
          ...prev,
          participants: prev.participants.filter((x) => x.userId !== p.peerId),
        };
      });
    };

    const onPeerDeclined = (p: { callId: string; peerId: string; callEnded?: boolean }) => {
      if (p.callEnded) {
        teardown();
        setCallState({ phase: "idle" });
      }
    };

    const onOffer = async (p: { callId: string; from: string; sdp: { type: string; sdp?: string } }) => {
      if (stateRef.current.phase === "idle") return;
      const mgr = getOrBuildManager(p.callId);
      const answer = await mgr.handleOffer(p.from, p.sdp as never);
      emitCallAnswerSdp({ callId: p.callId, to: p.from, sdp: answer });
    };

    const onAnswerSdp = async (p: { callId: string; from: string; sdp: { type: string; sdp?: string } }) => {
      await mgrRef.current?.handleAnswer(p.from, p.sdp as never);
    };

    const onIce = async (p: { callId: string; from: string; candidate: { candidate: string; sdpMLineIndex?: number | null; sdpMid?: string | null } }) => {
      await mgrRef.current?.addIceCandidate(p.from, p.candidate);
    };

    const onEnded = (p: { callId: string }) => {
      const cur = stateRef.current;
      if (cur.phase === "idle" || cur.callId !== p.callId) return;
      teardown();
      setCallState({ phase: "idle" });
    };

      socket.on("call:incoming", onIncoming);
      socket.on("call:joined", onJoined);
      socket.on("call:peer_joined", onPeerJoined);
      socket.on("call:peer_left", onPeerLeft);
      socket.on("call:peer_declined", onPeerDeclined);
      socket.on("call:offer", onOffer);
      socket.on("call:answer_sdp", onAnswerSdp);
      socket.on("call:ice_candidate", onIce);
      socket.on("call:ended", onEnded);
      socket.on("call:busy", onEnded);
    }

    // Subscribe to socket changes and attach immediately to current socket
    const unsub = subscribeCallSocket(attach);
    attach(getCallSocket());

    return () => {
      unsub();
      attach(null); // detach from current socket
    };
  }, [teardown, getOrBuildManager]);

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStreams,
        isMuted,
        isCameraOff,
        isSpeaker,
        initiateCall,
        answerCall,
        endCall,
        leaveCall,
        toggleMute,
        toggleCamera,
        toggleSpeaker,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

export function useCallSafe(): CallContextValue | null {
  return useContext(CallContext);
}
