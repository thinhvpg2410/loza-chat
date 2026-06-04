/**
 * Call-specific socket helpers.
 *
 * Thay vì import socket trực tiếp (private trong socket.ts),
 * module này expose getCallSocket() để CallProvider dùng socket hiện tại.
 */

import type { Socket } from "socket.io-client";

// Trỏ đến cùng socket instance với socket.ts qua module-level ref được set bởi connectChatSocket.
let _socketRef: Socket | null = null;

const callSocketListeners = new Set<(s: Socket | null) => void>();

/** Được gọi bởi connectChatSocket khi socket được tạo/destroy. */
export function setCallSocket(s: Socket | null) {
  _socketRef = s;
  for (const fn of callSocketListeners) {
    try { fn(s); } catch { /* ignore */ }
  }
}

export function getCallSocket(): Socket | null {
  return _socketRef;
}

/** Subscribe để biết khi socket instance thay đổi (connect/disconnect). */
export function subscribeCallSocket(listener: (s: Socket | null) => void): () => void {
  callSocketListeners.add(listener);
  return () => { callSocketListeners.delete(listener); };
}

export type CallType = "voice" | "video";

export function emitCallInitiate(opts: {
  callId: string;
  conversationId: string;
  callType: CallType;
}) {
  _socketRef?.emit("call:initiate", opts);
}

export function emitCallAnswer(opts: { callId: string; accepted: boolean }) {
  _socketRef?.emit("call:answer", opts);
}

export function emitCallEnd(callId: string) {
  _socketRef?.emit("call:end", { callId });
}

export function emitCallLeave(callId: string) {
  _socketRef?.emit("call:leave", { callId });
}

export function emitCallOffer(opts: {
  callId: string;
  to: string;
  sdp: unknown;
}) {
  _socketRef?.emit("call:offer", opts);
}

export function emitCallAnswerSdp(opts: {
  callId: string;
  to: string;
  sdp: unknown;
}) {
  _socketRef?.emit("call:answer_sdp", opts);
}

export function emitCallIceCandidate(opts: {
  callId: string;
  to: string;
  candidate: unknown;
}) {
  _socketRef?.emit("call:ice_candidate", opts);
}
