/**
 * WebRTC mesh peer manager.
 *
 * Design:
 * - One RTCPeerConnection per remote peer (full-mesh topology).
 * - ICE candidates are buffered until setRemoteDescription() is called.
 * - The EXISTING participant always creates the offer; the NEW joiner answers.
 *   This avoids SDP glare in group scenarios.
 */

// Use || instead of ?? so empty string "" also falls back to the default
const TURN_USER = process.env.NEXT_PUBLIC_TURN_USERNAME || "0646bc697c8d494f4aac97fd";
const TURN_CRED = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "uueIw+M9v8Vtg9Q8";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.relay.metered.ca:80" },
  { urls: "turn:global.relay.metered.ca:80",              username: TURN_USER, credential: TURN_CRED },
  { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: TURN_USER, credential: TURN_CRED },
  { urls: "turn:global.relay.metered.ca:443",             username: TURN_USER, credential: TURN_CRED },
  { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: TURN_USER, credential: TURN_CRED },
];

export type WebRTCCallbacks = {
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onIceCandidate: (peerId: string, candidate: RTCIceCandidateInit) => void;
  onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
};

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private readonly peers = new Map<string, RTCPeerConnection>();
  /** ICE candidates buffered before setRemoteDescription. */
  private readonly iceBuf = new Map<string, RTCIceCandidateInit[]>();
  private readonly cbs: WebRTCCallbacks;

  constructor(cbs: WebRTCCallbacks) {
    this.cbs = cbs;
  }

  // ── Local stream ──────────────────────────────────────────────────────────

  async initLocalStream(callType: 'voice' | 'video'): Promise<MediaStream> {
    this.stopLocalStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video:
        callType === 'video'
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          : false,
    });
    this.localStream = stream;
    this.cbs.onLocalStream(stream);
    return stream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(): boolean {
    const t = this.localStream?.getAudioTracks()[0];
    if (!t) return true;
    t.enabled = !t.enabled;
    return !t.enabled; // true = muted
  }

  toggleVideo(): boolean {
    const t = this.localStream?.getVideoTracks()[0];
    if (!t) return true;
    t.enabled = !t.enabled;
    return !t.enabled; // true = camera off
  }

  isMuted(): boolean {
    const t = this.localStream?.getAudioTracks()[0];
    return !t || !t.enabled;
  }

  isCameraOff(): boolean {
    const t = this.localStream?.getVideoTracks()[0];
    return !t || !t.enabled;
  }

  // ── Peer connections ──────────────────────────────────────────────────────

  private buildPc(peerId: string): RTCPeerConnection {
    if (this.peers.has(peerId)) {
      this.peers.get(peerId)!.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(peerId, pc);

    pc.onicecandidate = (e) => {
      if (e.candidate) this.cbs.onIceCandidate(peerId, e.candidate.toJSON());
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) this.cbs.onRemoteStream(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      this.cbs.onConnectionStateChange?.(peerId, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.cbs.onRemoteStreamRemoved(peerId);
        this.peers.delete(peerId);
        pc.close();
      }
    };

    // Attach local tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    return pc;
  }

  /** Existing participant → creates offer → sends to new joiner. */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const pc = this.buildPc(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }

  /** New joiner → receives offer from existing participant → creates answer. */
  async handleOffer(
    peerId: string,
    sdp: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    const pc = this.buildPc(peerId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    await this._flushIceBuf(peerId, pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  /** Existing participant → receives answer from new joiner. */
  async handleAnswer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    await this._flushIceBuf(peerId, pc);
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc || !pc.remoteDescription) {
      // Buffer until setRemoteDescription
      const buf = this.iceBuf.get(peerId) ?? [];
      buf.push(candidate);
      this.iceBuf.set(peerId, buf);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      /* stale candidate — ignore */
    }
  }

  private async _flushIceBuf(peerId: string, pc: RTCPeerConnection): Promise<void> {
    const buf = this.iceBuf.get(peerId) ?? [];
    this.iceBuf.delete(peerId);
    for (const c of buf) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
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
    for (const [peerId, pc] of this.peers) {
      pc.close();
      this.cbs.onRemoteStreamRemoved(peerId);
    }
    this.peers.clear();
    this.iceBuf.clear();
  }
}
