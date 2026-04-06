import type { MockConversation } from "@/constants/mockData";
import { MOCK_CONVERSATIONS } from "@/constants/mockData";
import { create } from "zustand";

/**
 * Conversation list + mock fetch — used by Expo Router tabs.
 * Thread UI uses `features/chat-room` local state; no duplicate message store here.
 */
type ChatState = {
  conversations: MockConversation[];
  loading: boolean;
  hasLoadedOnce: boolean;
  fetchConversations: () => Promise<void>;
  getTotalUnread: () => number;
  reset: () => void;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  loading: false,
  hasLoadedOnce: false,

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

  reset: () =>
    set({
      conversations: [],
      loading: false,
      hasLoadedOnce: false,
    }),
}));
