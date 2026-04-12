import type { MockConversation } from "@/constants/mockData";
import { MOCK_CONVERSATIONS } from "@/constants/mockData";
import { USE_API_MOCK } from "@/constants/env";
import { getApiErrorMessage } from "@/services/api/api";
import { fetchMyConversations } from "@/services/conversations/conversationsApi";
import { mapApiConversationToListItem } from "@/services/conversations/conversationListMapper";
import { create } from "zustand";

type ChatState = {
  conversations: MockConversation[];
  loading: boolean;
  hasLoadedOnce: boolean;
  fetchError: string | null;
  fetchConversations: () => Promise<void>;
  getTotalUnread: () => number;
  reset: () => void;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  loading: false,
  hasLoadedOnce: false,
  fetchError: null,

  fetchConversations: async () => {
    set({ loading: true, fetchError: null });
    try {
      if (USE_API_MOCK) {
        await delay(900);
        set({
          conversations: [...MOCK_CONVERSATIONS],
          loading: false,
          hasLoadedOnce: true,
          fetchError: null,
        });
        return;
      }

      const rows = await fetchMyConversations();
      set({
        conversations: rows.map(mapApiConversationToListItem),
        loading: false,
        hasLoadedOnce: true,
        fetchError: null,
      });
    } catch (e) {
      set({
        loading: false,
        hasLoadedOnce: true,
        fetchError: getApiErrorMessage(e),
      });
    }
  },

  getTotalUnread: () => get().conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),

  reset: () =>
    set({
      conversations: [],
      loading: false,
      hasLoadedOnce: false,
      fetchError: null,
    }),
}));
