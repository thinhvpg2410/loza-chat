import { Injectable, Logger } from '@nestjs/common';

export type CallType = 'voice' | 'video';
export type CallStatus = 'ringing' | 'active' | 'ended';

export const GROUP_CALL_MAX_PARTICIPANTS = 9;

export interface CallParticipant {
  userId: string;
  socketId: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CallState {
  callId: string;
  conversationId: string;
  callType: CallType;
  isGroup: boolean;
  initiatorId: string;
  /** Users currently connected to the call. */
  participants: CallParticipant[];
  /** Users invited but haven't answered yet. */
  pendingUserIds: Set<string>;
  status: CallStatus;
  startedAt: Date;
}

@Injectable()
export class CallService {
  private readonly logger = new Logger(CallService.name);
  private readonly calls = new Map<string, CallState>();
  /** userId → callId, to detect if user is busy. */
  private readonly userActiveCall = new Map<string, string>();

  createCall(opts: {
    callId: string;
    conversationId: string;
    callType: CallType;
    isGroup: boolean;
    initiatorId: string;
    initiatorSocketId: string;
    initiatorDisplayName: string;
    initiatorAvatarUrl: string | null;
    invitedUserIds: string[];
  }): CallState {
    const call: CallState = {
      callId: opts.callId,
      conversationId: opts.conversationId,
      callType: opts.callType,
      isGroup: opts.isGroup,
      initiatorId: opts.initiatorId,
      participants: [
        {
          userId: opts.initiatorId,
          socketId: opts.initiatorSocketId,
          displayName: opts.initiatorDisplayName,
          avatarUrl: opts.initiatorAvatarUrl,
        },
      ],
      pendingUserIds: new Set(opts.invitedUserIds),
      status: 'ringing',
      startedAt: new Date(),
    };
    this.calls.set(opts.callId, call);
    this.userActiveCall.set(opts.initiatorId, opts.callId);
    this.logger.debug(`Call created: ${opts.callId} by ${opts.initiatorId}`);
    return call;
  }

  getCall(callId: string): CallState | undefined {
    return this.calls.get(callId);
  }

  isUserBusy(userId: string): boolean {
    const callId = this.userActiveCall.get(userId);
    if (!callId) return false;
    const call = this.calls.get(callId);
    return !!call && call.status !== 'ended';
  }

  isCallFull(callId: string): boolean {
    const call = this.calls.get(callId);
    if (!call) return false;
    return call.participants.length >= GROUP_CALL_MAX_PARTICIPANTS;
  }

  /**
   * Join a user into a call. Returns the updated CallState and the list of
   * existing participant socket IDs that should receive `call:peer_joined`.
   */
  joinCall(
    callId: string,
    userId: string,
    socketId: string,
    displayName: string,
    avatarUrl: string | null,
  ): { call: CallState; existingSocketIds: string[] } | null {
    const call = this.calls.get(callId);
    if (!call || call.status === 'ended') return null;
    if (call.participants.length >= GROUP_CALL_MAX_PARTICIPANTS) return null;

    // Collect existing participant socket IDs BEFORE adding the new one
    const existingSocketIds = call.participants.map((p) => p.socketId);

    call.pendingUserIds.delete(userId);

    const already = call.participants.find((p) => p.userId === userId);
    if (!already) {
      call.participants.push({ userId, socketId, displayName, avatarUrl });
    } else {
      already.socketId = socketId;
    }

    if (call.status === 'ringing' && call.participants.length >= 2) {
      call.status = 'active';
    }

    this.userActiveCall.set(userId, callId);
    return { call, existingSocketIds };
  }

  endCall(callId: string): CallState | null {
    const call = this.calls.get(callId);
    if (!call) return null;
    if (call.status === 'ended') return call;

    call.status = 'ended';
    for (const p of call.participants) {
      this.userActiveCall.delete(p.userId);
    }
    for (const uid of call.pendingUserIds) {
      this.userActiveCall.delete(uid);
    }

    setTimeout(() => this.calls.delete(callId), 60_000);
    this.logger.debug(`Call ended: ${callId}`);
    return call;
  }

  rejectCall(callId: string, userId: string): 'ended' | 'pending' {
    const call = this.calls.get(callId);
    if (!call) return 'ended';
    call.pendingUserIds.delete(userId);
    this.userActiveCall.delete(userId);

    // End the call only if nobody answered and no more pending
    if (call.pendingUserIds.size === 0 && call.participants.length <= 1) {
      this.endCall(callId);
      return 'ended';
    }
    return 'pending';
  }

  /** Leave mid-call (without ending it for others). */
  leaveCall(callId: string, userId: string): CallState | null {
    const call = this.calls.get(callId);
    if (!call) return null;

    call.participants = call.participants.filter((p) => p.userId !== userId);
    this.userActiveCall.delete(userId);

    if (call.participants.length === 0) {
      this.endCall(callId);
      return null;
    }
    return call;
  }

  getParticipantSocketIds(callId: string, excludeUserId?: string): string[] {
    const call = this.calls.get(callId);
    if (!call) return [];
    return call.participants
      .filter((p) => p.userId !== excludeUserId)
      .map((p) => p.socketId);
  }

  getAllUserRooms(callId: string, excludeUserId?: string): string[] {
    const call = this.calls.get(callId);
    if (!call) return [];
    const ids: string[] = call.participants
      .filter((p) => p.userId !== excludeUserId)
      .map((p) => p.userId);
    for (const uid of call.pendingUserIds) {
      if (uid !== excludeUserId) ids.push(uid);
    }
    return ids;
  }
}
