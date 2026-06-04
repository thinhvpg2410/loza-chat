/**
 * WebRTC mesh peer manager for React Native (react-native-webrtc).
 *
 * Design mirrors the web version:
 * - One RTCPeerConnection per remote peer (full-mesh topology).
 * - ICE candidates are buffered until setRemoteDescription() is called.
 * - Existing participant creates the offer; new joiner answers.
 */

import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  type MediaStream,
} from "react-native-webrtc";

import { TURN_USERNAME, TURN_CREDENTIAL } from "@/constants/webrtcEnv";

export type RtcIceCandidateInit = {
  candidate: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
};

export type RtcSessionDescriptionInit = {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
};

const ICE_SERVERS = [
  { urls: "stun:stun.relay.metered.ca:80" },
  { urls: "turn:global.relay.metered.ca:80", username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turn:global.relay.metered.ca:443", username: TURN_USERNAME, credential: TURN_CREDENTIAL },
  { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: TURN_USERNAME, credential: TURN_CREDENTIAL },
];

export type WebRTCCallbacks = {
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onIceCandidate: (peerId: string, candidate: RtcIceCandidateInit) => void;
};

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly iceBuf = new Map<string, RtcIceCandidateInit[]>();
  private readonly cbs: WebRTCCallbacks;

  constructor(cbs: WebRTCCallbacks) {
    this.cbs = cbs;
  }

  // ── Local stream ─────────────────────────────────────────────────────────

  async initLocalStream(callType: "voice" | "video"): Promise<MediaStream> {
    this.stopLocalStream();
    const stream = (await mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: callType === "video" ? { facingMode: "user", width: 1280, height: 720 } : false,
    })) as MediaStream;
    this.localStream = stream;
    this.cbs.onLocalStream(stream);
    return stream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(): boolean {
    const track = this.localStream?.getAudioTracks()[0];
    if (!track) return true;
    track.enabled = !track.enabled;
    return !track.enabled;
  }

  toggleVideo(): boolean {
    const track = this.localStream?.getVideoTracks()[0];
    if (!track) return true;
    track.enabled = !track.enabled;
    return !track.enabled;
  }

  isMuted(): boolean {
    const track = this.localStream?.getAudioTracks()[0];
    return !track || !track.enabled;
  }

  isCameraOff(): boolean {
    const track = this.localStream?.getVideoTracks()[0];
    return !track || !track.enabled;
  }

  // ── Peer connections ──────────────────────────────────────────────────────

  private buildPc(peerId: string): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) existing.close();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(peerId, pc);

    pc.addEventListener("icecandidate", (e: any) => {
      if (e.candidate) {
        this.cbs.onIceCandidate(peerId, e.candidate.toJSON() as RtcIceCandidateInit);
      }
    });

    pc.addEventListener("track", (e: any) => {
      const stream: MediaStream | undefined = e.streams?.[0];
      if (stream) this.cbs.onRemoteStream(peerId, stream);
    });

    pc.addEventListener("connectionstatechange", () => {
      const state = (pc as any).connectionState as string | undefined;
      if (state === "disconnected" || state === "failed") {
        this.cbs.onRemoteStreamRemoved(peerId);
        this.peers.delete(peerId);
        pc.close();
      }
    });

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track as any, this.localStream as any);
      }
    }

    return pc;
  }

  async createOffer(peerId: string): Promise<RtcSessionDescriptionInit> {
    const pc = this.buildPc(peerId);
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer as any);
    return { type: (offer as any).type, sdp: (offer as any).sdp };
  }

  async handleOffer(
    peerId: string,
    sdp: RtcSessionDescriptionInit,
  ): Promise<RtcSessionDescriptionInit> {
    const pc = this.buildPc(peerId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp as any) as any);
    await this._flushIceBuf(peerId, pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer as any);
    return { type: (answer as any).type, sdp: (answer as any).sdp };
  }

  async handleAnswer(peerId: string, sdp: RtcSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp as any) as any);
    await this._flushIceBuf(peerId, pc);
  }

  async addIceCandidate(peerId: string, candidate: RtcIceCandidateInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc || !(pc as any).remoteDescription) {
      const buf = this.iceBuf.get(peerId) ?? [];
      buf.push(candidate);
      this.iceBuf.set(peerId, buf);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate as any) as any);
    } catch {
      /* stale candidate */
    }
  }

  private async _flushIceBuf(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const buf = this.iceBuf.get(peerId) ?? [];
    this.iceBuf.delete(peerId);
    for (const c of buf) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c as any) as any);
      } catch {
        /* ignore */
      }
    }
  }

  removePeer(peerId: string): void {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.iceBuf.delete(peerId);
    this.cbs.onRemoteStreamRemoved(peerId);
  }

  stopLocalStream(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
  }

  destroy(): void {
    this.stopLocalStream();
    for (const [, pc] of this.peers) {
      pc.close();
    }
    this.peers.clear();
    this.iceBuf.clear();
  }
}
