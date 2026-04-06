import { Injectable } from '@nestjs/common';

/**
 * Ephemeral typing indicators. Swap for Redis keys with TTL when multi-instance.
 */
@Injectable()
export class TypingStateService {
  private readonly byConversation = new Map<string, Set<string>>();

  startTyping(conversationId: string, userId: string): boolean {
    let set = this.byConversation.get(conversationId);
    if (!set) {
      set = new Set<string>();
      this.byConversation.set(conversationId, set);
    }
    const already = set.has(userId);
    set.add(userId);
    return !already;
  }

  stopTyping(conversationId: string, userId: string): boolean {
    const set = this.byConversation.get(conversationId);
    if (!set) {
      return false;
    }
    const had = set.delete(userId);
    if (set.size === 0) {
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
}
