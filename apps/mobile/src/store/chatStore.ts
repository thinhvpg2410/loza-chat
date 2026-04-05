import type { MockConversation } from "@/constants/mockData";
import { MOCK_CONVERSATIONS } from "@/constants/mockData";
import { buildMockThreadMessages } from "@/constants/mockThreadMessages";
import {
  emitMessageSend,
  isChatSocketMockMode,
} from "@/services/socket/socket";
import { useAuthStore } from "@/store/authStore";
import type { ChatMessage } from "@/types/chat";
import { create } from "zustand";

type ChatState = {
  conversations: MockConversation[];
  loading: boolean;
  hasLoadedOnce: boolean;
  messages: ChatMessage[];
  activeConversationId: string | null;
  activePeerId: string | null;
  typing: boolean;
  chatLoading: boolean;
  fetchConversations: () => Promise<void>;
  getTotalUnread: () => number;
  openChat: (conversationId: string, options?: { peerId?: string }) => Promise<void>;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  receiveMessage: (message: ChatMessage) => void;
  setTyping: (typing: boolean) => void;
  patchMessageStatus: (id: string, status: ChatMessage["status"]) => void;
  reset: () => void;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  loading: false,
  hasLoadedOnce: false,
  messages: [],
  activeConversationId: null,
  activePeerId: null,
  typing: false,
  chatLoading: false,

  fetchConversations: async () => {
    set({ loading: true });
    await delay(900);
    set({
      conversations: [...MOCK_CONVERSATIONS],
      loading: false,
      hasLoadedOnce: true,
    });
  },

  getTotalUnread: () =>
    get().conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),

  openChat: async (conversationId, options) => {
    const peerId = options?.peerId ?? `peer-${conversationId}`;
    const myId = useAuthStore.getState().user?.id ?? "local-me";
    set({
      activeConversationId: conversationId,
      activePeerId: peerId,
      chatLoading: true,
      messages: [],
      typing: false,
    });
    await delay(400);
    const messages = buildMockThreadMessages(conversationId, myId, peerId);
    set({ messages, chatLoading: false });
  },

  closeChat: () =>
    set({
      activeConversationId: null,
      activePeerId: null,
      messages: [],
      typing: false,
      chatLoading: false,
    }),

  patchMessageStatus: (id, status) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, status } : m)),
    })),

  sendMessage: (text) => {
    const { activeConversationId, activePeerId, messages } = get();
    if (!activeConversationId || !activePeerId || !text.trim()) return;

    const myId = useAuthStore.getState().user?.id ?? "local-me";
    const id = `me-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const msg: ChatMessage = {
      id,
      text: text.trim(),
      senderId: myId,
      createdAt: new Date().toISOString(),
      kind: "text",
      status: "sending",
    };

    set({ messages: [msg, ...messages] });

    setTimeout(() => get().patchMessageStatus(id, "sent"), 220);
    setTimeout(() => get().patchMessageStatus(id, "delivered"), 650);
    setTimeout(() => get().patchMessageStatus(id, "seen"), 1400);

    emitMessageSend({
      conversationId: activeConversationId,
      peerId: activePeerId,
      message: { ...msg, status: "sent" },
    });

    if (isChatSocketMockMode()) {
      get().setTyping(true);
      setTimeout(() => {
        get().receiveMessage({
          id: `peer-${Date.now()}`,
          text: "Đã nhận tin nhắn 👍",
          senderId: activePeerId,
          createdAt: new Date().toISOString(),
          kind: "text",
        });
        get().setTyping(false);
      }, 1600);
    }
  },

  receiveMessage: (message) => set((s) => ({ messages: [message, ...s.messages] })),

  setTyping: (typing) => set({ typing }),

  reset: () =>
    set({
      conversations: [],
      loading: false,
      hasLoadedOnce: false,
      messages: [],
      activeConversationId: null,
      activePeerId: null,
      typing: false,
      chatLoading: false,
    }),
}));

export type { ChatMessage } from "@/types/chat";
