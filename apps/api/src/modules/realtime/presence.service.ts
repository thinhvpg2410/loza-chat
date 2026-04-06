import { Injectable } from '@nestjs/common';

/**
 * In-memory presence for single-instance deployments.
 * Replace backing store with Redis + adapter when scaling horizontally.
 */
export interface PresenceSnapshot {
  online: boolean;
  lastHeartbeatAt: string | null;
  socketCount: number;
}

interface PresenceEntry {
  socketIds: Set<string>;
  lastHeartbeatAt: Date;
}

@Injectable()
export class PresenceService {
  private readonly byUser = new Map<string, PresenceEntry>();

  addSocket(userId: string, socketId: string): { becameOnline: boolean } {
    let entry = this.byUser.get(userId);
    if (!entry) {
      entry = { socketIds: new Set(), lastHeartbeatAt: new Date() };
      this.byUser.set(userId, entry);
    }
    const becameOnline = entry.socketIds.size === 0;
    entry.socketIds.add(socketId);
    entry.lastHeartbeatAt = new Date();
    return { becameOnline };
  }

  removeSocket(userId: string, socketId: string): { becameOffline: boolean } {
    const entry = this.byUser.get(userId);
    if (!entry) {
      return { becameOffline: false };
    }
    entry.socketIds.delete(socketId);
    if (entry.socketIds.size === 0) {
      this.byUser.delete(userId);
      return { becameOffline: true };
    }
    return { becameOffline: false };
  }

  heartbeat(userId: string, socketId: string): void {
    const entry = this.byUser.get(userId);
    if (!entry || !entry.socketIds.has(socketId)) {
      return;
    }
    entry.lastHeartbeatAt = new Date();
  }

  getSnapshot(userId: string): PresenceSnapshot {
    const entry = this.byUser.get(userId);
    if (!entry || entry.socketIds.size === 0) {
      return { online: false, lastHeartbeatAt: null, socketCount: 0 };
    }
    return {
      online: true,
      lastHeartbeatAt: entry.lastHeartbeatAt.toISOString(),
      socketCount: entry.socketIds.size,
    };
  }
}
