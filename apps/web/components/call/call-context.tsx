"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Socket } from "socket.io-client";
import { WebRTCManager } from "@/lib/webrtc/webrtc-manager";

export type CallType = "voice" | "video";

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
  viewerUserId: string;
  initiateCall: (opts: {
    callId: string;
    conversationId: string;
    callType: CallType;
    isGroup: boolean;
    conversationTitle: string;
    conversationAvatarUrl?: string;
    viewerDisplayName: string;
    viewerAvatarUrl?: string | null;
  }) => Promise<void>;
  answerCall: (accepted: boolean) => Promise<void>;
  endCall: () => void;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

type Props = {
  children: React.ReactNode;
  socketRef: RefObject<Socket | null>;
  viewerUserId: string;
  viewerDisplayName: string;
  viewerAvatarUrl?: string | null;
};

export function CallProvider({
  children,
  socketRef,
  viewerUserId,
  viewerDisplayName: _viewerDisplayName,
  viewerAvatarUrl: _viewerAvatarUrl,
}: Props) {
  const [callState, setCallState] = useState<CallState>({ phase: "idle" });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const mgrRef = useRef<WebRTCManager | null>(null);
  const stateRef = useRef<CallState>({ phase: "idle" });
  useEffect(() => {
    stateRef.current = callState;
  }, [callState]);

  const teardown = useCallback(() => {
    mgrRef.current?.destroy();
    mgrRef.current = null;
    setLocalStream(null);
    setRemoteStreams([]);
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  const getOrBuildManager = useCallback(
    (callId: string): WebRTCManager => {
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
          socketRef.current?.emit("call:ice_candidate", { callId, to: peerId, candidate }),
      });
      mgrRef.current = mgr;
      return mgr;
    },
    [socketRef],
  );

  // ── Public actions ─────────────────────────────────────────────────────────

  const initiateCall = useCallback(
    async (opts: {
      callId: string;
      conversationId: string;
      callType: CallType;
      isGroup: boolean;
      conversationTitle: string;
      conversationAvatarUrl?: string;
      viewerDisplayName: string;
      viewerAvatarUrl?: string | null;
    }) => {
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
      const mgr = getOrBuildManager(opts.callId);
      await mgr.initLocalStream(opts.callType);
      socketRef.current?.emit("call:initiate", {
        callId: opts.callId,
        conversationId: opts.conversationId,
        callType: opts.callType,
      });
    },
    [teardown, getOrBuildManager, socketRef],
  );

  const answerCall = useCallback(
    async (accepted: boolean) => {
      const state = stateRef.current;
      if (state.phase !== "incoming") return;
      if (!accepted) {
        socketRef.current?.emit("call:answer", { callId: state.callId, accepted: false });
        setCallState({ phase: "idle" });
        return;
      }
      const mgr = getOrBuildManager(state.callId);
      await mgr.initLocalStream(state.callType);
      socketRef.current?.emit("call:answer", { callId: state.callId, accepted: true });
    },
    [getOrBuildManager, socketRef],
  );

  /** For group calls: leave without hanging up for others. */
  const leaveCall = useCallback(() => {
    const state = stateRef.current;
    if (state.phase !== "idle") {
      socketRef.current?.emit("call:leave", { callId: state.callId });
    }
    teardown();
    setCallState({ phase: "idle" });
  }, [teardown, socketRef]);

  /** End the call entirely (all parties). */
  const endCall = useCallback(() => {
    const state = stateRef.current;
    if (state.phase !== "idle") {
      socketRef.current?.emit("call:end", { callId: state.callId });
    }
    teardown();
    setCallState({ phase: "idle" });
  }, [teardown, socketRef]);

  const toggleMute = useCallback(() => {
    const muted = mgrRef.current?.toggleAudio() ?? false;
    setIsMuted(muted);
  }, []);

  const toggleCamera = useCallback(() => {
    const off = mgrRef.current?.toggleVideo() ?? false;
    setIsCameraOff(off);
  }, []);

  // ── Socket event handlers ──────────────────────────────────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // ─ call:incoming ──────────────────────────────────────────────────────────
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
        // Auto-decline if already in a call
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

    // ─ call:joined ───────────────────────────────────────────────────────────
    // Sent to the NEW joiner with info about everyone already in the call.
    // The new joiner WAITS for offers from each existing participant.
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
          : state.phase === "outgoing"
            ? state.conversationTitle
            : state.conversationTitle;

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

    // ─ call:peer_joined ───────────────────────────────────────────────────────
    // Sent to EXISTING participants when a NEW peer joins.
    // This participant must create an offer to the new peer.
    const onPeerJoined = async (p: {
      callId: string;
      peerId: string;
      peerDisplayName: string;
      peerAvatarUrl: string | null;
    }) => {
      const state = stateRef.current;
      if (state.phase === "idle") return;

      // Add to participants list
      setCallState((prev) => {
        if (prev.phase !== "active" && prev.phase !== "outgoing") return prev;
        if (prev.phase === "outgoing") {
          // Outgoing caller becomes active on first peer join
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
        const already = prev.participants.some((x) => x.userId === p.peerId);
        if (already) return prev;
        return {
          ...prev,
          participants: [
            ...prev.participants,
            { userId: p.peerId, displayName: p.peerDisplayName, avatarUrl: p.peerAvatarUrl },
          ],
        };
      });

      // Create offer to the new peer (existing participant is the offerer)
      const mgr = mgrRef.current;
      if (!mgr) return;
      const offer = await mgr.createOffer(p.peerId);
      socket.emit("call:offer", { callId: p.callId, to: p.peerId, sdp: offer });
    };

    // ─ call:peer_left ──────────────────────────────────────────────────────────
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

    // ─ call:peer_declined ──────────────────────────────────────────────────────
    const onPeerDeclined = (p: { callId: string; peerId: string; callEnded?: boolean }) => {
      if (p.callEnded) {
        teardown();
        setCallState({ phase: "idle" });
      }
    };

    // ─ call:offer ─────────────────────────────────────────────────────────────
    // Sent to the new joiner by each existing participant.
    const onOffer = async (p: {
      callId: string;
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (stateRef.current.phase === "idle") return;
      const mgr = getOrBuildManager(p.callId);
      const answer = await mgr.handleOffer(p.from, p.sdp);
      socket.emit("call:answer_sdp", { callId: p.callId, to: p.from, sdp: answer });
    };

    // ─ call:answer_sdp ────────────────────────────────────────────────────────
    const onAnswerSdp = async (p: {
      callId: string;
      from: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      await mgrRef.current?.handleAnswer(p.from, p.sdp);
    };

    // ─ call:ice_candidate ─────────────────────────────────────────────────────
    const onIce = async (p: {
      callId: string;
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      await mgrRef.current?.addIceCandidate(p.from, p.candidate);
    };

    // ─ call:ended / call:busy ─────────────────────────────────────────────────
    const onEnded = (p: { callId: string }) => {
      const cur = stateRef.current;
      if (cur.phase === "idle") return;
      if (cur.callId !== p.callId) return;
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

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:joined", onJoined);
      socket.off("call:peer_joined", onPeerJoined);
      socket.off("call:peer_left", onPeerLeft);
      socket.off("call:peer_declined", onPeerDeclined);
      socket.off("call:offer", onOffer);
      socket.off("call:answer_sdp", onAnswerSdp);
      socket.off("call:ice_candidate", onIce);
      socket.off("call:ended", onEnded);
      socket.off("call:busy", onEnded);
    };
  }, [socketRef, teardown, getOrBuildManager]);

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStreams,
        isMuted,
        isCameraOff,
        viewerUserId,
        initiateCall,
        answerCall,
        endCall,
        leaveCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

/** Throws if used outside CallProvider. */
export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

/** Returns null when used outside CallProvider (safe for components that may render without it). */
export function useCallSafe(): CallContextValue | null {
  return useContext(CallContext);
}
