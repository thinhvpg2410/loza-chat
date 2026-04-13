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
  socketLastHeartbeatAt: Map<string, Date>;
}

@Injectable()
export class PresenceService {
  private readonly byUser = new Map<string, PresenceEntry>();
  // Consider a socket stale if no heartbeat arrives for this window.
  private static readonly SOCKET_STALE_AFTER_MS = 90_000;

  addSocket(userId: string, socketId: string): { becameOnline: boolean } {
    let entry = this.byUser.get(userId);
    if (!entry) {
      entry = {
        socketIds: new Set(),
        socketLastHeartbeatAt: new Map<string, Date>(),
      };
      this.byUser.set(userId, entry);
    }
    this.reapStaleSockets();
    const becameOnline = entry.socketIds.size === 0;
    entry.socketIds.add(socketId);
    entry.socketLastHeartbeatAt.set(socketId, new Date());
    return { becameOnline };
  }

  removeSocket(userId: string, socketId: string): { becameOffline: boolean } {
    const entry = this.byUser.get(userId);
    if (!entry) {
      return { becameOffline: false };
    }
    entry.socketIds.delete(socketId);
    entry.socketLastHeartbeatAt.delete(socketId);
    if (entry.socketIds.size === 0) {
      this.byUser.delete(userId);
      return { becameOffline: true };
    }
    return { becameOffline: false };
  }

  heartbeat(userId: string, socketId: string): void {
    this.reapStaleSockets();
    const entry = this.byUser.get(userId);
    if (!entry || !entry.socketIds.has(socketId)) {
      return;
    }
    entry.socketLastHeartbeatAt.set(socketId, new Date());
  }

  getSnapshot(userId: string): PresenceSnapshot {
    this.reapStaleSockets();
    const entry = this.byUser.get(userId);
    if (!entry || entry.socketIds.size === 0) {
      return { online: false, lastHeartbeatAt: null, socketCount: 0 };
    }
    let latest: Date | null = null;
    for (const at of entry.socketLastHeartbeatAt.values()) {
      if (!latest || at.getTime() > latest.getTime()) {
        latest = at;
      }
    }
    return {
      online: true,
      lastHeartbeatAt: latest ? latest.toISOString() : null,
      socketCount: entry.socketIds.size,
    };
  }

  /**
   * Drops stale sockets and returns users that transitioned from online to offline.
   */
  reapStaleSockets(nowMs = Date.now()): string[] {
    const offlineUsers: string[] = [];
    const threshold = nowMs - PresenceService.SOCKET_STALE_AFTER_MS;

    for (const [userId, entry] of this.byUser.entries()) {
      for (const socketId of entry.socketIds) {
        const lastAt = entry.socketLastHeartbeatAt.get(socketId);
        const lastMs = lastAt?.getTime() ?? 0;
        if (lastMs < threshold) {
          entry.socketIds.delete(socketId);
          entry.socketLastHeartbeatAt.delete(socketId);
        }
      }

      if (entry.socketIds.size === 0) {
        this.byUser.delete(userId);
        offlineUsers.push(userId);
      }
    }

    return offlineUsers;
  }
}
