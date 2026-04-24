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
  /** Monotonic signal when the server deletes a group conversation (socket `group:dissolved`). */
  lastGroupDissolved: { conversationId: string; seq: number } | null;
  /** `silent` avoids toggling `loading` (used for socket-driven list updates). */
  fetchConversations: (opts?: { silent?: boolean }) => Promise<void>;
  /** Coalesced refresh for realtime events (e.g. new message in another thread). */
  scheduleConversationsListRefresh: () => void;
  /** Notifies focused chat/group screens so they can navigate away. */
  notifyGroupDissolved: (conversationId: string) => void;
  getTotalUnread: () => number;
  reset: () => void;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let conversationsListRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function clearConversationsListRefreshTimer() {
  if (conversationsListRefreshTimer) {
    clearTimeout(conversationsListRefreshTimer);
    conversationsListRefreshTimer = null;
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  loading: false,
  hasLoadedOnce: false,
  fetchError: null,
  lastGroupDissolved: null,

  fetchConversations: async (opts) => {
    const silent = opts?.silent === true;
    if (!silent) {
      set({ loading: true, fetchError: null });
    }
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
      if (silent) {
        set({
          conversations: rows.map(mapApiConversationToListItem),
          hasLoadedOnce: true,
          fetchError: null,
        });
      } else {
        set({
          conversations: rows.map(mapApiConversationToListItem),
          loading: false,
          hasLoadedOnce: true,
          fetchError: null,
        });
      }
    } catch (e) {
      if (silent) {
        return;
      }
      set({
        loading: false,
        hasLoadedOnce: true,
        fetchError: getApiErrorMessage(e),
      });
    }
  },

  scheduleConversationsListRefresh: () => {
    if (USE_API_MOCK) return;
    if (conversationsListRefreshTimer) clearTimeout(conversationsListRefreshTimer);
    conversationsListRefreshTimer = setTimeout(() => {
      conversationsListRefreshTimer = null;
      void get().fetchConversations({ silent: true });
    }, 400);
  },

  notifyGroupDissolved: (conversationId: string) => {
    if (USE_API_MOCK) return;
    set((s) => ({
      lastGroupDissolved: {
        conversationId,
        seq: (s.lastGroupDissolved?.seq ?? 0) + 1,
      },
    }));
  },

  getTotalUnread: () => get().conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),

  reset: () => {
    clearConversationsListRefreshTimer();
    set({
      conversations: [],
      loading: false,
      hasLoadedOnce: false,
      fetchError: null,
      lastGroupDissolved: null,
    });
  },
}));
