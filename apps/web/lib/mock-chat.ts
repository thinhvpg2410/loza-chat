import type { Conversation, ConversationThread, Message } from "@/lib/types/chat";

/** Tạm thời: không có hội thoại / tin nhắn mock (tài khoản mới). */
export const mockThreads: ConversationThread[] = [];

export const mockConversations: Conversation[] = mockThreads.map((t) => t.conversation);

const messagesById: Record<string, Message[]> = Object.fromEntries(
  mockThreads.map((t) => [t.conversation.id, t.messages]),
);

export function getMessagesForConversation(conversationId: string): Message[] {
  return messagesById[conversationId] ?? [];
}

export function getConversationById(id: string): Conversation | undefined {
  return mockThreads.find((t) => t.conversation.id === id)?.conversation;
}
