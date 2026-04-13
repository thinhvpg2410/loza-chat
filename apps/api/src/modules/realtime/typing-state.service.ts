import { Injectable } from '@nestjs/common';

/**
 * Ephemeral typing indicators. Swap for Redis keys with TTL when multi-instance.
 */
@Injectable()
export class TypingStateService {
  private readonly byConversation = new Map<string, Map<string, number>>();
  private static readonly TYPING_STALE_AFTER_MS = 12_000;

  startTyping(conversationId: string, userId: string): boolean {
    let map = this.byConversation.get(conversationId);
    if (!map) {
      map = new Map<string, number>();
      this.byConversation.set(conversationId, map);
    }
    const already = map.has(userId);
    map.set(userId, Date.now());
    return !already;
  }

  stopTyping(conversationId: string, userId: string): boolean {
    const map = this.byConversation.get(conversationId);
    if (!map) {
      return false;
    }
    const had = map.delete(userId);
    if (map.size === 0) {
      this.byConversation.delete(conversationId);
    }
    return had;
  }

  clearUserFromConversations(
    userId: string,
    conversationIds: Iterable<string>,
  ): { conversationId: string; wasTyping: boolean }[] {
    const out: { conversationId: string; wasTyping: boolean }[] = [];
    for (const conversationId of conversationIds) {
      const wasTyping = this.stopTyping(conversationId, userId);
      out.push({ conversationId, wasTyping });
    }
    return out;
  }

  /**
   * Clears stale typing markers and returns rows that changed to not typing.
   */
  reapExpired(nowMs = Date.now()): { conversationId: string; userId: string }[] {
    const out: { conversationId: string; userId: string }[] = [];
    const threshold = nowMs - TypingStateService.TYPING_STALE_AFTER_MS;

    for (const [conversationId, users] of this.byConversation.entries()) {
      for (const [userId, lastAt] of users.entries()) {
        if (lastAt < threshold) {
          users.delete(userId);
          out.push({ conversationId, userId });
        }
      }
      if (users.size === 0) {
        this.byConversation.delete(conversationId);
      }
    }

    return out;
  }
}
